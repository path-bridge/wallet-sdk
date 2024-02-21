/// <reference types="node" />
import { EventEmitter } from "events";
import { ECPairInterface, bitcoin } from "../bitcoin-core";
export declare class SimpleKeyring extends EventEmitter {
    static type: string;
    type: string;
    network: bitcoin.Network;
    wallets: ECPairInterface[];
    constructor(opts?: any);
    serialize(): any;
    deserialize(opts: any): void;
    addAccounts(n?: number): string[];
    getAccounts(): string[];
    signTransaction(psbt: bitcoin.Psbt, inputs: {
        index: number;
        publicKey: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
    }[], opts?: any): bitcoin.Psbt;
    signMessage(publicKey: string, text: string): any;
    verifyMessage(publicKey: string, text: string, sig: string): any;
    private _getPrivateKeyFor;
    exportAccount(publicKey: string): string;
    removeAccount(publicKey: string): void;
    private _getWalletForAccount;
}
