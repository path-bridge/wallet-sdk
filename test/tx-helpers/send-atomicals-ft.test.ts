import { expect } from "chai";
import { AddressType } from "../../src/types";
import { ErrorCodes } from "../../src/error";
import { LocalWallet } from "../../src/wallet";
import {
  dummySendAtomicalsFT,
  expectFeeRate,
  genDummyAtomicalsFT,
  genDummyUtxo,
} from "./utils";
import { bitcoin } from "../../src/bitcoin-core";

describe("send atomicals FT", () => {
  beforeEach(() => {
    // todo
  });

  const testAddressTypes = [
    AddressType.P2TR,
    AddressType.P2SH_P2WPKH,
    AddressType.P2PKH,
    AddressType.P2SH_P2WPKH,
    AddressType.M44_P2TR, // deprecated
    AddressType.M44_P2WPKH, // deprecated
  ];
  testAddressTypes.forEach((addressType) => {
    const fromBtcWallet = LocalWallet.fromRandom(
      addressType,
      bitcoin.networks.bitcoin
    );
    const fromAssetWallet = LocalWallet.fromRandom(
      addressType,
      bitcoin.networks.bitcoin
    );

    const toWallet = LocalWallet.fromRandom(addressType, bitcoin.networks.bitcoin);

    describe("basic " + addressType, function () {
      it("send atomicals ft", async function () {
        const ret = dummySendAtomicalsFT({
          toAddress: toWallet.address,
          assetWallet: fromAssetWallet,
          assetUtxo: genDummyUtxo(fromAssetWallet, 1000, {
            atomicals: [genDummyAtomicalsFT()],
          }),
          btcWallet: fromBtcWallet,
          btcUtxos: [genDummyUtxo(fromBtcWallet, 1000)],
          feeRate: 1,
          sendAmount: 500,
        });
        expect(ret.inputCount).eq(2);
        expect(ret.outputCount).eq(3);
        expectFeeRate(addressType, ret.feeRate, 1);
      });

      it("require btc utxos", async function () {
        let error: any = null;
        try {
          const ret = dummySendAtomicalsFT({
            toAddress: toWallet.address,
            assetWallet: fromAssetWallet,
            assetUtxo: genDummyUtxo(fromAssetWallet, 10000, {
              atomicals: [genDummyAtomicalsFT()],
            }),
            btcWallet: fromBtcWallet,
            btcUtxos: [],
            feeRate: 1,
            dump: true,
            sendAmount: 500,
          });
        } catch (e) {
          error = e;
        }
        expect(error.code).eq(ErrorCodes.INSUFFICIENT_BTC_UTXO);
      });
    });
  });
});
