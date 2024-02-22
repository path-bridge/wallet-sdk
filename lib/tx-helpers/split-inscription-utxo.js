"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitInscriptionUtxo = void 0;
const constants_1 = require("../constants");
const error_1 = require("../error");
const transaction_1 = require("../transaction");
function splitInscriptionUtxo({ btcUtxos, assetUtxo, network, changeAddress, feeRate, enableRBF = true, outputValue = 546, }) {
    if (transaction_1.utxoHelper.hasAnyAssets(btcUtxos)) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    if (transaction_1.utxoHelper.hasAtomicals([assetUtxo])) {
        throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
    }
    const tx = new transaction_1.Transaction(network, feeRate, changeAddress, enableRBF);
    const toSignInputs = [];
    let lastUnit = null;
    let splitedCount = 0;
    const ordUtxo = new transaction_1.InscriptionUnspendOutput(assetUtxo, outputValue);
    tx.addInput(ordUtxo.utxo);
    toSignInputs.push({ index: 0, publicKey: ordUtxo.utxo.pubkey });
    let tmpOutputCounts = 0;
    for (let j = 0; j < ordUtxo.inscriptionUnits.length; j++) {
        const unit = ordUtxo.inscriptionUnits[j];
        if (unit.hasInscriptions()) {
            tx.addChangeOutput(unit.satoshis);
            lastUnit = unit;
            tmpOutputCounts++;
            splitedCount++;
            continue;
        }
        tx.addChangeOutput(unit.satoshis);
        lastUnit = unit;
    }
    if (!lastUnit.hasInscriptions()) {
        tx.removeChangeOutput();
    }
    if (lastUnit.satoshis < constants_1.UTXO_DUST) {
        lastUnit.satoshis = constants_1.UTXO_DUST;
    }
    const _toSignInputs = tx.addSufficientUtxosForFee(btcUtxos);
    toSignInputs.push(..._toSignInputs);
    const psbt = tx.toPsbt();
    return { psbt, toSignInputs, splitedCount };
}
exports.splitInscriptionUtxo = splitInscriptionUtxo;
