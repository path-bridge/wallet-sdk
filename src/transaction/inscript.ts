import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";
import { witnessStackToScriptWitness } from "bitcoinjs-lib/src/psbt/psbtutils";
import { bitcoin } from "../bitcoin-core";
import { Transaction } from "./transaction";
import { NetworkType, toPsbtNetwork } from "../network";
import { UnspentOutput } from "../types";
import { UTXO_DUST } from "../constants";

export interface Inscription {
    contentType: string;
    content: string;
    revealAddr: string;
}

export interface CommitTxData {
    scriptTaproot: bitcoin.payments.Payment;
    tapLeafScript: {
        leafVersion: number,
        script: Buffer,
        controlBlock: any,
    }
    outputAmount?: number;
}

export class DummySigner implements bitcoin.Signer {

    publicKey: Buffer;
    network?: bitcoin.networks.Network;

    constructor(publicKey: Buffer) {
        this.publicKey = publicKey;
    }

    sign(hash: Buffer, lowR?: boolean): Buffer {
        return Buffer.alloc(64, 0);
    }
    signSchnorr(hash: Buffer) {
        return Buffer.alloc(64, 0);
    }

    getPublicKey(): Buffer {
        return this.publicKey;
    }
}

function chunkContent(data: Buffer) {
    const body = [];
    let start = 0;
    while (start < data.length) {
        body.push(data.subarray(start, start + exports.MAX_CHUNK_SIZE));
        start += exports.MAX_CHUNK_SIZE;
    }
    return body;
}

function createInscriptionScript(xOnlyPublicKey: Buffer, inscription: Inscription) {
    const protocolId = Buffer.from('ord');
    return [
        xOnlyPublicKey,
        bitcoin.opcodes.OP_CHECKSIG,
        bitcoin.opcodes.OP_0,
        bitcoin.opcodes.OP_IF,
        protocolId,
        1,
        1,
        Buffer.from(inscription.contentType),
        bitcoin.opcodes.OP_0,
        ...chunkContent(Buffer.from(inscription.content)),
        bitcoin.opcodes.OP_ENDIF,
    ];
}

export function createCommitTxData(networkType: NetworkType, publicKey: Buffer, inscription: Inscription) {
    const network = toPsbtNetwork(networkType);
    const xOnlyPublicKey = toXOnly(publicKey);
    const script = createInscriptionScript(xOnlyPublicKey, inscription);
    const outputScript = bitcoin.script.compile(script);
    const scriptTree = {
        output: outputScript,
        redeemVersion: 192,
    };
    const scriptTaproot = bitcoin.payments.p2tr({
        internalPubkey: xOnlyPublicKey,
        scriptTree,
        redeem: scriptTree,
        network
    });

    var _a: any;
    const cblock = (_a = scriptTaproot.witness) === null || _a === void 0 ? void 0 : _a[scriptTaproot.witness.length - 1];
    const tapLeafScript = {
        leafVersion: scriptTaproot.redeemVersion,
        script: outputScript,
        controlBlock: cblock,
    };
    return {
        scriptTaproot,
        tapLeafScript,
    };
}

export function estimateRevealTxSize(networkType: NetworkType, publicKey: Buffer, commitTxData: CommitTxData, toAddress: string, amount: number) {
    const network = toPsbtNetwork(networkType);
    const psbt = new bitcoin.Psbt({ network });
    const { scriptTaproot, tapLeafScript } = commitTxData;
    psbt.addInput({
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
            value: amount,
            script: scriptTaproot.output,
        },
        tapLeafScript: [tapLeafScript],
    });
    psbt.addOutput({
        value: amount,
        address: toAddress,
    });
    psbt.signInput(0, new DummySigner(publicKey));
    psbt.finalizeInput(0, customFinalizer(commitTxData));
    const tx = psbt.extractTransaction();
    return tx.virtualSize();
}

export function buildCommitTx(networkType: NetworkType,
    publicKey: Buffer,
    commitTxDatas: CommitTxData[],
    inscriptions: Inscription[],
    unspents: UnspentOutput[],
    changeAddress: string,
    feeRate: number) {

    const tx = new Transaction(networkType, feeRate, changeAddress);

    // const network = toPsbtNetwork(networkType);

    let totalOutAmount = 0;
    for (var i = 0; i < commitTxDatas.length; i++) {
        const outputAmount = estimateRevealTxSize(networkType, publicKey, commitTxDatas[i], inscriptions[i].revealAddr, UTXO_DUST) * feeRate + UTXO_DUST;
        commitTxDatas[i].outputAmount = outputAmount;
        tx.addOutput(commitTxDatas[i].scriptTaproot.address, outputAmount);
        totalOutAmount += outputAmount;
    }

    // tx.addSufficientUtxosForFee()


    let totalInAmount = 0;
    for (var i = 0; i < unspents.length; i++) {
        tx.addInput(unspents[i]);
        totalInAmount += unspents[i].satoshis;

        // const fee = await tx.calNetworkFee();
        // const unspent = tx.getTotalInput() - fee;

        if (totalInAmount > totalOutAmount) {
            try {

            } catch (error) {
            }
        }
    }
    throw new Error("insufficient");
}

export function buildRevealTx(networkType: NetworkType, commitTxData: CommitTxData,
    inscription: Inscription, commitTx: bitcoin.Transaction, index: number = 0) {
    const network = toPsbtNetwork(networkType);
    const { scriptTaproot, tapLeafScript } = commitTxData;
    const psbt = new bitcoin.Psbt({ network });
    psbt.addInput({
        hash: commitTx.getId(),
        index: index,
        witnessUtxo: {
            value: commitTxData.outputAmount,
            script: scriptTaproot.output,
        },
        nonWitnessUtxo: commitTx.toBuffer(),
        tapLeafScript: [tapLeafScript],
    });
    psbt.addOutput({
        value: UTXO_DUST,
        address: inscription.revealAddr,
    });
    return psbt;
}

const customFinalizer = (commitTxData: CommitTxData) => {
    const { tapLeafScript } = commitTxData;
    return (inputIndex, input) => {
        const witness = [input.tapScriptSig[inputIndex].signature]
            .concat(tapLeafScript.script)
            .concat(tapLeafScript.controlBlock);
        return {
            finalScriptWitness: witnessStackToScriptWitness(witness),
        };
    };
};

export function signRevealTx(signer: bitcoin.Signer, commitTxData: CommitTxData, psbt: bitcoin.Psbt) {
    psbt.signInput(0, signer);
    psbt.finalizeInput(0, customFinalizer(commitTxData));
    return psbt.extractTransaction();
}