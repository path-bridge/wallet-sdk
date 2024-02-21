import bitcore from "bitcore-lib";
import { ECPairInterface, bitcoin } from "../bitcoin-core";
import { SimpleKeyring } from "./simple-keyring";
interface DeserializeOption {
    hdPath?: string;
    mnemonic?: string;
    xpriv?: string;
    activeIndexes?: number[];
    passphrase?: string;
}
export declare class HdKeyring extends SimpleKeyring {
    static type: string;
    type: string;
    mnemonic: string;
    xpriv: string;
    passphrase: string;
    network: bitcoin.Network;
    hdPath: string;
    root: bitcore.HDPrivateKey;
    hdWallet?: any;
    wallets: ECPairInterface[];
    private _index2wallet;
    activeIndexes: number[];
    page: number;
    perPage: number;
    constructor(opts?: DeserializeOption);
    serialize(): DeserializeOption;
    deserialize(_opts?: DeserializeOption): void;
    initFromXpriv(xpriv: string): void;
    initFromMnemonic(mnemonic: string): void;
    changeHdPath(hdPath: string): void;
    getAccountByHdPath(hdPath: string, index: number): string;
    addAccounts(numberOfAccounts?: number): string[];
    activeAccounts(indexes: number[]): string[];
    getFirstPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getNextPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getPreviousPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getAddresses(start: number, end: number): {
        address: string;
        index: number;
    }[];
    __getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
    getAccounts(): any[];
    getIndexByAddress(address: string): number;
    private _addressFromIndex;
}
export {};
