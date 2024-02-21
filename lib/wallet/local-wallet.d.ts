import { bitcoin } from "../bitcoin-core";
import { SimpleKeyring } from "../keyring";
import { NetworkType } from "../network";
import { AddressType, SignPsbtOptions } from "../types";
import { AbstractWallet } from "./abstract-wallet";
export declare class LocalWallet implements AbstractWallet {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    addressType: AddressType;
    networkType: NetworkType;
    scriptPk: string;
    constructor(wif: string, addressType?: AddressType, networkType?: NetworkType);
    static fromMnemonic(addressType: AddressType, networkType: NetworkType, mnemonic: string, passPhrase?: string, hdPath?: string): LocalWallet;
    static fromRandom(addressType?: AddressType, networkType?: NetworkType): LocalWallet;
    getNetworkType(): NetworkType;
    private formatOptionsToSignInputs;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): bitcoin.Psbt;
    getPublicKey(): string;
    signMessage(text: string, type: "bip322-simple" | "ecdsa"): string;
}
