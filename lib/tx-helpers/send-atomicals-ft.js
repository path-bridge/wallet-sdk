"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAtomicalsFT = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
// only one arc20 can be send
function sendAtomicalsFT({ assetUtxos, btcUtxos, toAddress, network, changeAssetAddress, sendAmount, changeAddress, feeRate, enableRBF = true, }) {
    // safe check
    if (utxo_1.utxoHelper.hasAtomicalsNFT(assetUtxos) ||
        utxo_1.utxoHelper.hasInscription(assetUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(network, feeRate, changeAddress, enableRBF);
    const toSignInputs = [];
    const totalInputFTAmount = assetUtxos.reduce((acc, v) => acc + v.satoshis, 0);
    if (sendAmount > totalInputFTAmount) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_ASSET_UTXO);
    }
    // add assets
    assetUtxos.forEach((v, index) => {
        tx.addInput(v);
        toSignInputs.push({ index, publicKey: v.pubkey });
    });
    // add receiver
    tx.addOutput(toAddress, sendAmount);
    // add change
    const changeArc20Amount = totalInputFTAmount - sendAmount;
    if (changeArc20Amount > 0) {
        tx.addOutput(changeAssetAddress, changeArc20Amount);
    }
    // add btc
    const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos, true);
    toSignInputs.push(..._toSignInputs);
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendAtomicalsFT = sendAtomicalsFT;
