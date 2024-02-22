import { bitcoin } from "../bitcoin-core";
import { SimpleKeyring } from "../keyring";
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
    addressType: AddressType;
    constructor(wif: string, network?: bitcoin.Network, addressType?: AddressType);
    static fromRandom(addressType?: AddressType, network?: bitcoin.Network): EstimateWallet;
    getNetwork(): bitcoin.networks.Network;
    private formatOptionsToSignInputs;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): bitcoin.Psbt;
    getPublicKey(): string;
    signMessage(text: string, type: "bip322-simple" | "ecdsa"): string;
}
