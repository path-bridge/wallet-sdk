import { NetworkType } from "../network";
import { AbstractWallet } from "../wallet";
/**
 * refference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
export declare function signMessageOfBIP322Simple({ message, address, networkType, wallet, }: {
    message: string;
    address: string;
    networkType: NetworkType;
    wallet: AbstractWallet;
}): string;
export declare function verifyMessageOfBIP322Simple(address: string, msg: string, signature: string, networkType?: NetworkType): boolean;
