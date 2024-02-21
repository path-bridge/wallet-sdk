"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptPkToAddress = exports.getAddressType = exports.isValidAddress = exports.addressToScriptPk = exports.publicKeyToScriptPk = exports.publicKeyToAddress = exports.publicKeyToPayment = void 0;
const bitcoin_core_1 = require("../bitcoin-core");
const network_1 = require("../network");
const types_1 = require("../types");
/**
 * Convert public key to bitcoin payment object.
 */
function publicKeyToPayment(publicKey, type, networkType) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    if (!publicKey)
        return null;
    const pubkey = Buffer.from(publicKey, "hex");
    if (type === types_1.AddressType.P2PKH) {
        return bitcoin_core_1.bitcoin.payments.p2pkh({
            pubkey,
            network,
        });
    }
    else if (type === types_1.AddressType.P2WPKH || type === types_1.AddressType.M44_P2WPKH) {
        return bitcoin_core_1.bitcoin.payments.p2wpkh({
            pubkey,
            network,
        });
    }
    else if (type === types_1.AddressType.P2TR || type === types_1.AddressType.M44_P2TR) {
        return bitcoin_core_1.bitcoin.payments.p2tr({
            internalPubkey: pubkey.slice(1, 33),
            network,
        });
    }
    else if (type === types_1.AddressType.P2SH_P2WPKH) {
        const data = bitcoin_core_1.bitcoin.payments.p2wpkh({
            pubkey,
            network,
        });
        return bitcoin_core_1.bitcoin.payments.p2sh({
            pubkey,
            network,
            redeem: data,
        });
    }
}
exports.publicKeyToPayment = publicKeyToPayment;
/**
 * Convert public key to bitcoin address.
 */
function publicKeyToAddress(publicKey, type, networkType) {
    const payment = publicKeyToPayment(publicKey, type, networkType);
    if (payment && payment.address) {
        return payment.address;
    }
    else {
        return "";
    }
}
exports.publicKeyToAddress = publicKeyToAddress;
/**
 * Convert public key to bitcoin scriptPk.
 */
function publicKeyToScriptPk(publicKey, type, networkType) {
    const payment = publicKeyToPayment(publicKey, type, networkType);
    return payment.output.toString("hex");
}
exports.publicKeyToScriptPk = publicKeyToScriptPk;
/**
 * Convert bitcoin address to scriptPk.
 */
function addressToScriptPk(address, networkType) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    return bitcoin_core_1.bitcoin.address.toOutputScript(address, network);
}
exports.addressToScriptPk = addressToScriptPk;
/**
 * Check if the address is valid.
 */
function isValidAddress(address, networkType = network_1.NetworkType.MAINNET) {
    let error;
    try {
        bitcoin_core_1.bitcoin.address.toOutputScript(address, (0, network_1.toPsbtNetwork)(networkType));
    }
    catch (e) {
        error = e;
    }
    if (error) {
        return false;
    }
    else {
        return true;
    }
}
exports.isValidAddress = isValidAddress;
/**
 * Get address type.
 */
function getAddressType(address, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    let type;
    try {
        const decoded = bitcoin_core_1.bitcoin.address.fromBase58Check(address);
        if (decoded.version === network.pubKeyHash) {
            type = types_1.AddressType.P2PKH;
        }
        else if (decoded.version === network.scriptHash) {
            type = types_1.AddressType.P2SH_P2WPKH; //P2SH
        }
        else {
            throw `unknown version number: ${decoded.version}`;
        }
    }
    catch (error) {
        try {
            // not a Base58 address, try Bech32
            const decodedBech32 = bitcoin_core_1.bitcoin.address.fromBech32(address);
            if (decodedBech32.version === 0 && decodedBech32.data.length === 20) {
                type = types_1.AddressType.P2WPKH;
            }
            else if (decodedBech32.version === 0 &&
                decodedBech32.data.length === 32) {
                type = types_1.AddressType.P2WSH;
            }
            else if (decodedBech32.version === 1 &&
                decodedBech32.data.length === 32) {
                type = types_1.AddressType.P2TR;
            }
            else {
                throw `unknown Bech32 address format`;
            }
        }
        catch (err) {
            throw "unsupport address type: " + address;
        }
    }
    return type;
}
exports.getAddressType = getAddressType;
/**
 * Convert scriptPk to address.
 */
function scriptPkToAddress(scriptPk, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    try {
        const address = bitcoin_core_1.bitcoin.address.fromOutputScript(typeof scriptPk === "string" ? Buffer.from(scriptPk, "hex") : scriptPk, network);
        return address;
    }
    catch (e) {
        return "";
    }
}
exports.scriptPkToAddress = scriptPkToAddress;
