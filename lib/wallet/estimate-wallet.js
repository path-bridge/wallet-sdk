"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateWallet = void 0;
const address_1 = require("../address");
const bitcoin_core_1 = require("../bitcoin-core");
const keyring_1 = require("../keyring");
const message_1 = require("../message");
const network_1 = require("../network");
const types_1 = require("../types");
const utils_1 = require("../utils");
/**
 * EstimateWallet is a wallet that can be used to estimate the size of a transaction.
 */
class EstimateWallet {
    constructor(wif, networkType = network_1.NetworkType.MAINNET, addressType = types_1.AddressType.P2WPKH) {
        const network = (0, network_1.toPsbtNetwork)(networkType);
        const keyPair = bitcoin_core_1.ECPair.fromWIF(wif, network);
        this.keyring = new keyring_1.SimpleKeyring([keyPair.privateKey.toString("hex")]);
        this.keyring.addAccounts(1);
        this.pubkey = keyPair.publicKey.toString("hex");
        this.address = (0, address_1.publicKeyToAddress)(this.pubkey, addressType, networkType);
        this.network = network;
        this.networkType = networkType;
        this.addressType = addressType;
    }
    static fromRandom(addressType = types_1.AddressType.P2WPKH, networkType = network_1.NetworkType.MAINNET) {
        const network = (0, network_1.toPsbtNetwork)(networkType);
        const ecpair = bitcoin_core_1.ECPair.makeRandom({ network });
        const wallet = new EstimateWallet(ecpair.toWIF(), networkType, addressType);
        return wallet;
    }
    getNetworkType() {
        return this.networkType;
    }
    formatOptionsToSignInputs(_psbt, options) {
        const accountAddress = this.address;
        const accountPubkey = this.getPublicKey();
        let toSignInputs = [];
        if (options && options.toSignInputs) {
            // We expect userToSignInputs objects to be similar to ToSignInput interface,
            // but we allow address to be specified in addition to publicKey for convenience.
            toSignInputs = options.toSignInputs.map((input) => {
                var _a;
                const index = Number(input.index);
                if (isNaN(index))
                    throw new Error("invalid index in toSignInput");
                if (!input.address &&
                    !input.publicKey) {
                    throw new Error("no address or public key in toSignInput");
                }
                if (input.address &&
                    input.address != accountAddress) {
                    throw new Error("invalid address in toSignInput");
                }
                if (input.publicKey &&
                    input.publicKey != accountPubkey) {
                    throw new Error("invalid public key in toSignInput");
                }
                const sighashTypes = (_a = input.sighashTypes) === null || _a === void 0 ? void 0 : _a.map(Number);
                if (sighashTypes === null || sighashTypes === void 0 ? void 0 : sighashTypes.some(isNaN))
                    throw new Error("invalid sighash type in toSignInput");
                return {
                    index,
                    publicKey: accountPubkey,
                    sighashTypes,
                    disableTweakSigner: input.disableTweakSigner,
                };
            });
        }
        else {
            const networkType = this.getNetworkType();
            const psbtNetwork = (0, network_1.toPsbtNetwork)(networkType);
            const psbt = typeof _psbt === "string"
                ? bitcoin_core_1.bitcoin.Psbt.fromHex(_psbt, { network: psbtNetwork })
                : _psbt;
            psbt.data.inputs.forEach((v, index) => {
                let script = null;
                let value = 0;
                if (v.witnessUtxo) {
                    script = v.witnessUtxo.script;
                    value = v.witnessUtxo.value;
                }
                else if (v.nonWitnessUtxo) {
                    const tx = bitcoin_core_1.bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
                    const output = tx.outs[psbt.txInputs[index].index];
                    script = output.script;
                    value = output.value;
                }
                const isSigned = v.finalScriptSig || v.finalScriptWitness;
                if (script && !isSigned) {
                    const address = (0, address_1.scriptPkToAddress)(script, this.networkType);
                    if (accountAddress === address) {
                        toSignInputs.push({
                            index,
                            publicKey: accountPubkey,
                            sighashTypes: v.sighashType ? [v.sighashType] : undefined,
                        });
                    }
                }
            });
        }
        return toSignInputs;
    }
    signPsbt(psbt, opts) {
        const _opts = opts || {
            autoFinalized: true,
            toSignInputs: [],
        };
        let _inputs = this.formatOptionsToSignInputs(psbt, opts);
        if (_inputs.length == 0) {
            throw new Error("no input to sign");
        }
        psbt.data.inputs.forEach((v, index) => {
            var _a;
            const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
            const isP2TR = this.addressType === types_1.AddressType.P2TR ||
                this.addressType === types_1.AddressType.M44_P2TR;
            const lostInternalPubkey = !v.tapInternalKey;
            // Special measures taken for compatibility with certain applications.
            if (isNotSigned && isP2TR && lostInternalPubkey) {
                const tapInternalKey = (0, utils_1.toXOnly)(Buffer.from(this.pubkey, "hex"));
                const { output } = bitcoin_core_1.bitcoin.payments.p2tr({
                    internalPubkey: tapInternalKey,
                    network: (0, network_1.toPsbtNetwork)(this.networkType),
                });
                if (((_a = v.witnessUtxo) === null || _a === void 0 ? void 0 : _a.script.toString("hex")) == (output === null || output === void 0 ? void 0 : output.toString("hex"))) {
                    v.tapInternalKey = tapInternalKey;
                }
            }
        });
        psbt = this.keyring.signTransaction(psbt, _inputs);
        if (_opts.autoFinalized) {
            psbt.finalizeAllInputs();
        }
        return psbt;
    }
    getPublicKey() {
        const pubkeys = this.keyring.getAccounts();
        return pubkeys[0];
    }
    signMessage(text, type) {
        if (type === "bip322-simple") {
            return (0, message_1.signMessageOfBIP322Simple)({
                message: text,
                address: this.address,
                networkType: this.networkType,
                wallet: this,
            });
        }
        else {
            const pubkey = this.getPublicKey();
            return this.keyring.signMessage(pubkey, text);
        }
    }
}
exports.EstimateWallet = EstimateWallet;
