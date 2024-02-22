import { bitcoin } from "../bitcoin-core";
import { AbstractWallet } from "../wallet";
/**
 * refference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
export declare function signMessageOfBIP322Simple({ message, address, network, wallet, }: {
    message: string;
    address: string;
    network: bitcoin.Network;
    wallet: AbstractWallet;
}): string;
export declare function verifyMessageOfBIP322Simple(address: string, msg: string, signature: string, network?: bitcoin.Network): boolean;
