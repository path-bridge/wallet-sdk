import { bitcoin } from "../bitcoin-core";
import { ToSignInput, UnspentOutput } from "../types";
export declare function sendAtomicalsFT({ assetUtxos, btcUtxos, toAddress, network, changeAssetAddress, sendAmount, changeAddress, feeRate, enableRBF, }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    toAddress: string;
    network: bitcoin.Network;
    changeAssetAddress: string;
    sendAmount: number;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
};
