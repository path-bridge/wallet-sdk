import { bitcoin } from "../bitcoin-core";
import { SimpleKeyring } from "../keyring";
import { NetworkType } from "../network";
import { AddressType, SignPsbtOptions } from "../types";
import { AbstractWallet } from "./abstract-wallet";
/**
 * EstimateWallet is a wallet that can be used to estimate the size of a transaction.
 */
export declare class EstimateWallet implements AbstractWallet {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    networkType: NetworkType;
    addressType: AddressType;
    constructor(wif: string, networkType?: NetworkType, addressType?: AddressType);
    static fromRandom(addressType?: AddressType, networkType?: NetworkType): EstimateWallet;
    getNetworkType(): NetworkType;
    private formatOptionsToSignInputs;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): bitcoin.Psbt;
    getPublicKey(): string;
    signMessage(text: string, type: "bip322-simple" | "ecdsa"): string;
}
