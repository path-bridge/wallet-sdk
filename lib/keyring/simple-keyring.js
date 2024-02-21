"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleKeyring = void 0;
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const bs58check_1 = require("bs58check");
const events_1 = require("events");
const bitcoin_core_1 = require("../bitcoin-core");
const message_1 = require("../message");
const utils_1 = require("../utils");
const type = "Simple Key Pair";
class SimpleKeyring extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.type = type;
        this.network = bitcoin_core_1.bitcoin.networks.bitcoin;
        this.wallets = [];
        if (opts) {
            this.deserialize(opts);
        }
    }
    serialize() {
        return this.wallets.map((wallet) => wallet.privateKey.toString("hex"));
    }
    deserialize(opts) {
        const privateKeys = opts;
        this.wallets = privateKeys.map((key) => {
            let buf;
            if (key.length === 64) {
                // privateKey
                buf = Buffer.from(key, "hex");
            }
            else {
                //base58 decode(key).slice(1, 33);
                buf = Buffer.from((0, bs58check_1.decode)(key), 1, 32);
            }
            return bitcoin_core_1.ECPair.fromPrivateKey(buf);
        });
    }
    addAccounts(n = 1) {
        const newWallets = [];
        for (let i = 0; i < n; i++) {
            newWallets.push(bitcoin_core_1.ECPair.makeRandom());
        }
        this.wallets = this.wallets.concat(newWallets);
        const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString("hex"));
        return hexWallets;
    }
    getAccounts() {
        return this.wallets.map(({ publicKey }) => publicKey.toString("hex"));
    }
    signTransaction(psbt, inputs, opts) {
        inputs.forEach((input) => {
            const keyPair = this._getPrivateKeyFor(input.publicKey);
            if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[input.index]) &&
                !input.disableTweakSigner) {
                const signer = (0, utils_1.tweakSigner)(keyPair, opts);
                psbt.signInput(input.index, signer, input.sighashTypes);
            }
            else {
                const signer = keyPair;
                psbt.signInput(input.index, signer, input.sighashTypes);
            }
        });
        return psbt;
    }
    signMessage(publicKey, text) {
        const keyPair = this._getPrivateKeyFor(publicKey);
        return (0, message_1.signMessageOfECDSA)(keyPair, text);
    }
    verifyMessage(publicKey, text, sig) {
        return (0, message_1.verifyMessageOfECDSA)(publicKey, text, sig);
    }
    _getPrivateKeyFor(publicKey) {
        if (!publicKey) {
            throw new Error("Must specify publicKey.");
        }
        const wallet = this._getWalletForAccount(publicKey);
        return wallet;
    }
    exportAccount(publicKey) {
        const wallet = this._getWalletForAccount(publicKey);
        return wallet.privateKey.toString("hex");
    }
    removeAccount(publicKey) {
        if (!this.wallets
            .map((wallet) => wallet.publicKey.toString("hex"))
            .includes(publicKey)) {
            throw new Error(`PublicKey ${publicKey} not found in this keyring`);
        }
        this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString("hex") !== publicKey);
    }
    _getWalletForAccount(publicKey) {
        let wallet = this.wallets.find((wallet) => wallet.publicKey.toString("hex") == publicKey);
        if (!wallet) {
            throw new Error("Simple Keyring - Unable to find matching publicKey.");
        }
        return wallet;
    }
}
exports.SimpleKeyring = SimpleKeyring;
SimpleKeyring.type = type;
