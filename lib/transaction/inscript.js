"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signRevealTx = exports.buildRevealTx = exports.buildCommitTx = exports.estimateRevealTxSize = exports.createCommitTxData = exports.DummySigner = void 0;
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const psbtutils_1 = require("bitcoinjs-lib/src/psbt/psbtutils");
const bitcoin_core_1 = require("../bitcoin-core");
const transaction_1 = require("./transaction");
const network_1 = require("../network");
const constants_1 = require("../constants");
class DummySigner {
    constructor(publicKey) {
        this.publicKey = publicKey;
    }
    sign(hash, lowR) {
        return Buffer.alloc(64, 0);
    }
    signSchnorr(hash) {
        return Buffer.alloc(64, 0);
    }
    getPublicKey() {
        return this.publicKey;
    }
}
exports.DummySigner = DummySigner;
function chunkContent(data) {
    const body = [];
    let start = 0;
    while (start < data.length) {
        body.push(data.subarray(start, start + 520));
        start += 520;
    }
    return body;
}
function createInscriptionScript(xOnlyPublicKey, inscription) {
    const protocolId = Buffer.from('ord');
    return [
        xOnlyPublicKey,
        bitcoin_core_1.bitcoin.opcodes.OP_CHECKSIG,
        bitcoin_core_1.bitcoin.opcodes.OP_0,
        bitcoin_core_1.bitcoin.opcodes.OP_IF,
        protocolId,
        1,
        1,
        Buffer.from(inscription.contentType),
        bitcoin_core_1.bitcoin.opcodes.OP_0,
        ...chunkContent(Buffer.from(inscription.content)),
        bitcoin_core_1.bitcoin.opcodes.OP_ENDIF,
    ];
}
function createCommitTxData(networkType, publicKey, inscription) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const xOnlyPublicKey = (0, bip371_1.toXOnly)(publicKey);
    const script = createInscriptionScript(xOnlyPublicKey, inscription);
    const outputScript = bitcoin_core_1.bitcoin.script.compile(script);
    const scriptTree = {
        output: outputScript,
        redeemVersion: 192,
    };
    const scriptTaproot = bitcoin_core_1.bitcoin.payments.p2tr({
        internalPubkey: xOnlyPublicKey,
        scriptTree,
        redeem: scriptTree,
        network
    });
    var _a;
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
exports.createCommitTxData = createCommitTxData;
function estimateRevealTxSize(networkType, publicKey, commitTxData, toAddress, amount) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const psbt = new bitcoin_core_1.bitcoin.Psbt({ network });
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
exports.estimateRevealTxSize = estimateRevealTxSize;
function buildCommitTx(networkType, publicKey, commitTxDatas, inscriptions, unspents, changeAddress, feeRate) {
    const tx = new transaction_1.Transaction(networkType, feeRate, changeAddress);
    // const network = toPsbtNetwork(networkType);
    let totalOutAmount = 0;
    for (var i = 0; i < commitTxDatas.length; i++) {
        const outputAmount = estimateRevealTxSize(networkType, publicKey, commitTxDatas[i], inscriptions[i].revealAddr, constants_1.UTXO_DUST) * feeRate + constants_1.UTXO_DUST;
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
            }
            catch (error) {
            }
        }
    }
    throw new Error("insufficient");
}
exports.buildCommitTx = buildCommitTx;
function buildRevealTx(networkType, commitTxData, inscription, commitTx, index = 0) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const { scriptTaproot, tapLeafScript } = commitTxData;
    const psbt = new bitcoin_core_1.bitcoin.Psbt({ network });
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
        value: constants_1.UTXO_DUST,
        address: inscription.revealAddr,
    });
    return psbt;
}
exports.buildRevealTx = buildRevealTx;
const customFinalizer = (commitTxData) => {
    const { tapLeafScript } = commitTxData;
    return (inputIndex, input) => {
        const witness = [input.tapScriptSig[inputIndex].signature]
            .concat(tapLeafScript.script)
            .concat(tapLeafScript.controlBlock);
        return {
            finalScriptWitness: (0, psbtutils_1.witnessStackToScriptWitness)(witness),
        };
    };
};
function signRevealTx(signer, commitTxData, psbt) {
    psbt.signInput(0, signer);
    psbt.finalizeInput(0, customFinalizer(commitTxData));
    return psbt.extractTransaction();
}
exports.signRevealTx = signRevealTx;
