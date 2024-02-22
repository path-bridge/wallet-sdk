import { bitcoin } from "../bitcoin-core";
import { UnspentOutput } from "../types";
export declare function sendInscription({ assetUtxo, btcUtxos, toAddress, network, changeAddress, feeRate, outputValue, enableRBF, enableMixed, }: {
    assetUtxo: UnspentOutput;
    btcUtxos: UnspentOutput[];
    toAddress: string;
    network: bitcoin.Network;
    changeAddress: string;
    feeRate: number;
    outputValue: number;
    enableRBF?: boolean;
    enableMixed?: boolean;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: import("../types").ToSignInput[];
};
