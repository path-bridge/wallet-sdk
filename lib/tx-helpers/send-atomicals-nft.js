"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAtomicalsNFT = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendAtomicalsNFT({ assetUtxo, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF = true, }) {
    // safe check
    if (utxo_1.utxoHelper.hasAtomicalsFT([assetUtxo]) ||
        utxo_1.utxoHelper.hasInscription([assetUtxo])) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (assetUtxo.atomicals.length !== 1) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(networkType, feeRate, changeAddress, enableRBF);
    const toSignInputs = [];
    // add asset
    tx.addInput(assetUtxo);
    toSignInputs.push({ index: 0, publicKey: assetUtxo.pubkey });
    tx.addOutput(toAddress, assetUtxo.satoshis);
    // add btc
    const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos, true);
    toSignInputs.push(..._toSignInputs);
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendAtomicalsNFT = sendAtomicalsNFT;
