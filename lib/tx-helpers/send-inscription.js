"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInscription = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendInscription({ assetUtxo, btcUtxos, toAddress, network, changeAddress, feeRate, outputValue, enableRBF = true, enableMixed = false, }) {
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (utxo_1.utxoHelper.hasAtomicals([assetUtxo])) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (!enableMixed && assetUtxo.inscriptions.length !== 1) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const maxOffset = assetUtxo.inscriptions.reduce((pre, cur) => {
        return Math.max(pre, cur.offset);
    }, 0);
    if (outputValue - 1 < maxOffset) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.ASSET_MAYBE_LOST);
    }
    const tx = new transaction_1.Transaction(network, feeRate, changeAddress, enableRBF);
    tx.addInput(assetUtxo);
    tx.addOutput(toAddress, outputValue);
    const toSignInputs = tx.addSufficientUtxosForFee(btcUtxos);
    toSignInputs.push({
        index: 0,
        publicKey: assetUtxo.pubkey,
    });
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendInscription = sendInscription;
