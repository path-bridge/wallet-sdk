import { bitcoin } from "../bitcoin-core";
import { UTXO_DUST } from "../constants";
import { ErrorCodes, WalletUtilsError } from "../error";
import { Transaction } from "../transaction/transaction";
import { utxoHelper } from "../transaction/utxo";
import { ToSignInput, UnspentOutput } from "../types";

export function sendBTC({
  btcUtxos,
  tos,
  network,
  changeAddress,
  feeRate,
  enableRBF = true,
}: {
  btcUtxos: UnspentOutput[];
  tos: {
    address: string;
    satoshis: number;
  }[];
  network: bitcoin.Network;
  changeAddress: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction(network, feeRate, changeAddress, enableRBF);

  tos.forEach((v) => {
    tx.addOutput(v.address, v.satoshis);
  });

  const toSignInputs = tx.addSufficientUtxosForFee(btcUtxos);

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}

export function sendAllBTC({
  btcUtxos,
  toAddress,
  network,
  feeRate,
  enableRBF = true,
}: {
  btcUtxos: UnspentOutput[];
  toAddress: string;
  network: bitcoin.Network;
  feeRate: number;
  enableRBF?: boolean;
}) {
  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction(network, feeRate, null, enableRBF);
  tx.addOutput(toAddress, UTXO_DUST);

  const toSignInputs: ToSignInput[] = [];
  btcUtxos.forEach((v, index) => {
    tx.addInput(v);
    toSignInputs.push({ index, publicKey: v.pubkey });
  });

  const fee = tx.calNetworkFee();
  const unspent = tx.getTotalInput() - fee;
  if (unspent < UTXO_DUST) {
    throw new WalletUtilsError(ErrorCodes.INSUFFICIENT_BTC_UTXO);
  }
  tx.outputs[0].value = unspent;

  const psbt = tx.toPsbt();

  return { psbt, toSignInputs };
}
