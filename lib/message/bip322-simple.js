"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMessageOfBIP322Simple = exports.signMessageOfBIP322Simple = void 0;
const varuint_bitcoin_1 = require("varuint-bitcoin");
const address_1 = require("../address");
const bitcoin_core_1 = require("../bitcoin-core");
const network_1 = require("../network");
const types_1 = require("../types");
const utils_1 = require("../utils");
function bip0322_hash(message) {
    const { sha256 } = bitcoin_core_1.bitcoin.crypto;
    const tag = "BIP0322-signed-message";
    const tagHash = sha256(Buffer.from(tag));
    const result = sha256(Buffer.concat([tagHash, tagHash, Buffer.from(message)]));
    return result.toString("hex");
}
/**
 * refference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
function signMessageOfBIP322Simple({ message, address, networkType, wallet, }) {
    const outputScript = (0, address_1.addressToScriptPk)(address, networkType);
    const addressType = (0, address_1.getAddressType)(address, networkType);
    const supportedTypes = [
        types_1.AddressType.P2WPKH,
        types_1.AddressType.P2TR,
        types_1.AddressType.M44_P2WPKH,
        types_1.AddressType.M44_P2TR,
    ];
    if (supportedTypes.includes(addressType) == false) {
        throw new Error("Not support address type to sign");
    }
    const prevoutHash = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([
        Buffer.from("0020", "hex"),
        Buffer.from(bip0322_hash(message), "hex"),
    ]);
    const txToSpend = new bitcoin_core_1.bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const psbtToSign = new bitcoin_core_1.bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0,
        },
    });
    psbtToSign.addOutput({ script: Buffer.from("6a", "hex"), value: 0 });
    wallet.signPsbt(psbtToSign);
    const txToSign = psbtToSign.extractTransaction();
    function encodeVarString(b) {
        return Buffer.concat([(0, varuint_bitcoin_1.encode)(b.byteLength), b]);
    }
    const len = (0, varuint_bitcoin_1.encode)(txToSign.ins[0].witness.length);
    const result = Buffer.concat([
        len,
        ...txToSign.ins[0].witness.map((w) => encodeVarString(w)),
    ]);
    const signature = result.toString("base64");
    return signature;
}
exports.signMessageOfBIP322Simple = signMessageOfBIP322Simple;
function verifyMessageOfBIP322Simple(address, msg, signature, networkType = network_1.NetworkType.MAINNET) {
    const addressType = (0, address_1.getAddressType)(address, networkType);
    if (addressType === types_1.AddressType.P2WPKH ||
        addressType === types_1.AddressType.M44_P2WPKH) {
        return verifySignatureOfBIP322Simple_P2PWPKH(address, msg, signature, networkType);
    }
    else if (addressType === types_1.AddressType.P2TR ||
        addressType === types_1.AddressType.M44_P2TR) {
        return verifySignatureOfBIP322Simple_P2TR(address, msg, signature, networkType);
    }
    return false;
}
exports.verifyMessageOfBIP322Simple = verifyMessageOfBIP322Simple;
function verifySignatureOfBIP322Simple_P2TR(address, msg, sign, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const outputScript = bitcoin_core_1.bitcoin.address.toOutputScript(address, network);
    const prevoutHash = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([
        Buffer.from("0020", "hex"),
        Buffer.from(bip0322_hash(msg), "hex"),
    ]);
    const txToSpend = new bitcoin_core_1.bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const data = Buffer.from(sign, "base64");
    const _res = bitcoin_core_1.bitcoin.script.decompile(data.slice(1));
    const signature = _res[0];
    const pubkey = Buffer.from("02" + outputScript.subarray(2).toString("hex"), "hex");
    const psbtToSign = new bitcoin_core_1.bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0,
        },
    });
    psbtToSign.addOutput({ script: Buffer.from("6a", "hex"), value: 0 });
    const tapKeyHash = psbtToSign.__CACHE.__TX.hashForWitnessV1(0, [outputScript], [0], 0);
    const valid = (0, utils_1.schnorrValidator)(pubkey, tapKeyHash, signature);
    return valid;
}
function verifySignatureOfBIP322Simple_P2PWPKH(address, msg, sign, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const outputScript = bitcoin_core_1.bitcoin.address.toOutputScript(address, network);
    const prevoutHash = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([
        Buffer.from("0020", "hex"),
        Buffer.from(bip0322_hash(msg), "hex"),
    ]);
    const txToSpend = new bitcoin_core_1.bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const data = Buffer.from(sign, "base64");
    const _res = bitcoin_core_1.bitcoin.script.decompile(data.slice(1));
    const psbtToSign = new bitcoin_core_1.bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0,
        },
    });
    psbtToSign.addOutput({ script: Buffer.from("6a", "hex"), value: 0 });
    psbtToSign.updateInput(0, {
        partialSig: [
            {
                pubkey: _res[1],
                signature: _res[0],
            },
        ],
    });
    const valid = psbtToSign.validateSignaturesOfAllInputs(utils_1.validator);
    return valid;
}
