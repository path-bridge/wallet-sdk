/// <reference types="node" />
import { bitcoin } from "../bitcoin-core";
import { NetworkType } from "../network";
import { AddressType } from "../types";
/**
 * Convert public key to bitcoin payment object.
 */
export declare function publicKeyToPayment(publicKey: string, type: AddressType, networkType: NetworkType): bitcoin.payments.Payment;
/**
 * Convert public key to bitcoin address.
 */
export declare function publicKeyToAddress(publicKey: string, type: AddressType, networkType: NetworkType): string;
/**
 * Convert public key to bitcoin scriptPk.
 */
export declare function publicKeyToScriptPk(publicKey: string, type: AddressType, networkType: NetworkType): string;
/**
 * Convert bitcoin address to scriptPk.
 */
export declare function addressToScriptPk(address: string, networkType: NetworkType): Buffer;
/**
 * Check if the address is valid.
 */
export declare function isValidAddress(address: string, networkType?: NetworkType): boolean;
/**
 * Get address type.
 */
export declare function getAddressType(address: string, networkType?: NetworkType): AddressType;
/**
 * Convert scriptPk to address.
 */
export declare function scriptPkToAddress(scriptPk: string | Buffer, networkType?: NetworkType): string;
