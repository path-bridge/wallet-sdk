import { bitcoin } from "../bitcoin-core";
import { ErrorCodes, WalletUtilsError } from "../error";
import { Transaction } from "../transaction/transaction";
import { utxoHelper } from "../transaction/utxo";
import { ToSignInput, UnspentOutput } from "../types";

export function sendAtomicalsNFT({
  assetUtxo,
  btcUtxos,
  toAddress,
  network,
  changeAddress,
  feeRate,
  enableRBF = true,
}: {
  assetUtxo: UnspentOutput;
  btcUtxos: UnspentOutput[];
  toAddress: string;
  network: bitcoin.Network;
  changeAddress: string;
  feeRate: number;
  enableRBF?: boolean;
}) {
  // safe check
  if (
    utxoHelper.hasAtomicalsFT([assetUtxo]) ||
    utxoHelper.hasInscription([assetUtxo])
  ) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (utxoHelper.hasAnyAssets(btcUtxos)) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  if (assetUtxo.atomicals.length !== 1) {
    throw new WalletUtilsError(ErrorCodes.NOT_SAFE_UTXOS);
  }

  const tx = new Transaction(network, feeRate, changeAddress, enableRBF);

  const toSignInputs: ToSignInput[] = [];

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
