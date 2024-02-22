"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAllBTC = exports.sendBTC = void 0;
const constants_1 = require("../constants");
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendBTC({ btcUtxos, tos, network, changeAddress, feeRate, enableRBF = true, }) {
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(network, feeRate, changeAddress, enableRBF);
    tos.forEach((v) => {
        tx.addOutput(v.address, v.satoshis);
    });
    const toSignInputs = tx.addSufficientUtxosForFee(btcUtxos);
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendBTC = sendBTC;
function sendAllBTC({ btcUtxos, toAddress, network, feeRate, enableRBF = true, }) {
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(network, feeRate, null, enableRBF);
    tx.addOutput(toAddress, constants_1.UTXO_DUST);
    const toSignInputs = [];
    btcUtxos.forEach((v, index) => {
        tx.addInput(v);
        toSignInputs.push({ index, publicKey: v.pubkey });
    });
    const fee = tx.calNetworkFee();
    const unspent = tx.getTotalInput() - fee;
    if (unspent < constants_1.UTXO_DUST) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_BTC_UTXO);
    }
    tx.outputs[0].value = unspent;
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendAllBTC = sendAllBTC;
