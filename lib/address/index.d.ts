/// <reference types="node" />
import { bitcoin } from "../bitcoin-core";
import { AddressType } from "../types";
/**
 * Convert public key to bitcoin payment object.
 */
export declare function publicKeyToPayment(publicKey: string, type: AddressType, network: bitcoin.Network): bitcoin.payments.Payment;
/**
 * Convert public key to bitcoin address.
 */
export declare function publicKeyToAddress(publicKey: string, type: AddressType, network: bitcoin.Network): string;
/**
 * Convert public key to bitcoin scriptPk.
 */
export declare function publicKeyToScriptPk(publicKey: string, type: AddressType, network: bitcoin.Network): string;
/**
 * Convert bitcoin address to scriptPk.
 */
export declare function addressToScriptPk(address: string, network: bitcoin.Network): Buffer;
/**
 * Check if the address is valid.
 */
export declare function isValidAddress(address: string, network?: bitcoin.Network): boolean;
/**
 * Get address type.
 */
export declare function getAddressType(address: string, network?: bitcoin.Network): AddressType;
/**
 * Convert scriptPk to address.
 */
export declare function scriptPkToAddress(scriptPk: string | Buffer, network?: bitcoin.Network): string;
