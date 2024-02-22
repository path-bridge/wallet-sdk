"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInscriptions = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendInscriptions({ assetUtxos, btcUtxos, toAddress, network, changeAddress, feeRate, enableRBF = true, }) {
    if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (utxo_1.utxoHelper.hasAtomicals(assetUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(network, feeRate, changeAddress, enableRBF);
    const toSignInputs = [];
    for (let i = 0; i < assetUtxos.length; i++) {
        const assetUtxo = assetUtxos[i];
        if (assetUtxo.inscriptions.length > 1) {
            throw new Error("Multiple inscriptions in one UTXO! Please split them first.");
        }
        tx.addInput(assetUtxo);
        tx.addOutput(toAddress, assetUtxo.satoshis);
        toSignInputs.push({ index: i, publicKey: assetUtxo.pubkey });
    }
    const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos);
    toSignInputs.push(..._toSignInputs);
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs };
}
exports.sendInscriptions = sendInscriptions;
