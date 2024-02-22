import { bitcoin } from "../bitcoin-core";
import { SimpleKeyring } from "../keyring";
import { AddressType, SignPsbtOptions } from "../types";
import { AbstractWallet } from "./abstract-wallet";
export declare class LocalWallet implements AbstractWallet {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    addressType: AddressType;
    scriptPk: string;
    constructor(wif: string, addressType?: AddressType, network?: bitcoin.Network);
    static fromMnemonic(addressType: AddressType, network: bitcoin.Network, mnemonic: string, passPhrase?: string, hdPath?: string): LocalWallet;
    static fromRandom(addressType?: AddressType, network?: bitcoin.Network): LocalWallet;
    getNetwork(): bitcoin.networks.Network;
    private formatOptionsToSignInputs;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): bitcoin.Psbt;
    getPublicKey(): string;
    signMessage(text: string, type: "bip322-simple" | "ecdsa"): string;
}
