"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HdKeyring = void 0;
const bip39 = __importStar(require("bip39"));
const hdkey = __importStar(require("hdkey"));
const bitcoin_core_1 = require("../bitcoin-core");
const simple_keyring_1 = require("./simple-keyring");
const hdPathString = "m/44'/0'/0'/0";
const type = "HD Key Tree";
class HdKeyring extends simple_keyring_1.SimpleKeyring {
    /* PUBLIC METHODS */
    constructor(opts) {
        super(null);
        this.type = type;
        this.mnemonic = null;
        this.xpriv = null;
        this.network = bitcoin_core_1.bitcoin.networks.bitcoin;
        this.hdPath = hdPathString;
        this.root = null;
        this.wallets = [];
        this._index2wallet = {};
        this.activeIndexes = [];
        this.page = 0;
        this.perPage = 5;
        if (opts) {
            this.deserialize(opts);
        }
    }
    serialize() {
        return {
            mnemonic: this.mnemonic,
            xpriv: this.xpriv,
            activeIndexes: this.activeIndexes,
            hdPath: this.hdPath,
            passphrase: this.passphrase,
        };
    }
    deserialize(_opts = {}) {
        if (this.root) {
            throw new Error("Btc-Hd-Keyring: Secret recovery phrase already provided");
        }
        let opts = _opts;
        this.wallets = [];
        this.mnemonic = null;
        this.xpriv = null;
        this.root = null;
        this.hdPath = opts.hdPath || hdPathString;
        if (opts.passphrase) {
            this.passphrase = opts.passphrase;
        }
        if (opts.mnemonic) {
            this.initFromMnemonic(opts.mnemonic);
        }
        else if (opts.xpriv) {
            this.initFromXpriv(opts.xpriv);
        }
        if (opts.activeIndexes) {
            this.activeAccounts(opts.activeIndexes);
        }
    }
    initFromXpriv(xpriv) {
        if (this.root) {
            throw new Error("Btc-Hd-Keyring: Secret recovery phrase already provided");
        }
        this.xpriv = xpriv;
        this._index2wallet = {};
        this.hdWallet = hdkey.fromJSON({ xpriv });
        this.root = this.hdWallet;
    }
    initFromMnemonic(mnemonic) {
        if (this.root) {
            throw new Error("Btc-Hd-Keyring: Secret recovery phrase already provided");
        }
        this.mnemonic = mnemonic;
        this._index2wallet = {};
        const seed = bip39.mnemonicToSeedSync(mnemonic, this.passphrase);
        this.hdWallet = hdkey.fromMasterSeed(seed);
        this.root = this.hdWallet.derive(this.hdPath);
    }
    changeHdPath(hdPath) {
        if (!this.mnemonic) {
            throw new Error("Btc-Hd-Keyring: Not support");
        }
        this.hdPath = hdPath;
        this.root = this.hdWallet.derive(this.hdPath);
        const indexes = this.activeIndexes;
        this._index2wallet = {};
        this.activeIndexes = [];
        this.wallets = [];
        this.activeAccounts(indexes);
    }
    getAccountByHdPath(hdPath, index) {
        if (!this.mnemonic) {
            throw new Error("Btc-Hd-Keyring: Not support");
        }
        const root = this.hdWallet.derive(hdPath);
        const child = root.deriveChild(index);
        const ecpair = bitcoin_core_1.ECPair.fromPrivateKey(child.privateKey);
        const address = ecpair.publicKey.toString("hex");
        return address;
    }
    addAccounts(numberOfAccounts = 1) {
        let count = numberOfAccounts;
        let currentIdx = 0;
        const newWallets = [];
        while (count) {
            const [, wallet] = this._addressFromIndex(currentIdx);
            if (this.wallets.includes(wallet)) {
                currentIdx++;
            }
            else {
                this.wallets.push(wallet);
                newWallets.push(wallet);
                this.activeIndexes.push(currentIdx);
                count--;
            }
        }
        const hexWallets = newWallets.map((w) => {
            return w.publicKey.toString("hex");
        });
        return hexWallets;
    }
    activeAccounts(indexes) {
        const accounts = [];
        for (const index of indexes) {
            const [address, wallet] = this._addressFromIndex(index);
            this.wallets.push(wallet);
            this.activeIndexes.push(index);
            accounts.push(address);
        }
        return accounts;
    }
    getFirstPage() {
        this.page = 0;
        return this.__getPage(1);
    }
    getNextPage() {
        return this.__getPage(1);
    }
    getPreviousPage() {
        return this.__getPage(-1);
    }
    getAddresses(start, end) {
        const from = start;
        const to = end;
        const accounts = [];
        for (let i = from; i < to; i++) {
            const [address] = this._addressFromIndex(i);
            accounts.push({
                address,
                index: i + 1,
            });
        }
        return accounts;
    }
    __getPage(increment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.page += increment;
            if (!this.page || this.page <= 0) {
                this.page = 1;
            }
            const from = (this.page - 1) * this.perPage;
            const to = from + this.perPage;
            const accounts = [];
            for (let i = from; i < to; i++) {
                const [address] = this._addressFromIndex(i);
                accounts.push({
                    address,
                    index: i + 1,
                });
            }
            return accounts;
        });
    }
    getAccounts() {
        this.wallets.map((w) => w.publicKey.toString("hex"));
        return this.wallets;
    }
    getIndexByAddress(address) {
        for (const key in this._index2wallet) {
            if (this._index2wallet[key][0] === address) {
                return Number(key);
            }
        }
        return null;
    }
    _addressFromIndex(i) {
        if (!this._index2wallet[i]) {
            const child = this.root.deriveChild(i);
            const ecpair = bitcoin_core_1.ECPair.fromPrivateKey(child.privateKey);
            const address = ecpair.publicKey.toString("hex");
            this._index2wallet[i] = [address, ecpair];
        }
        return this._index2wallet[i];
    }
}
exports.HdKeyring = HdKeyring;
HdKeyring.type = type;
