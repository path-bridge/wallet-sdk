import { bitcoin } from "../bitcoin-core";
import { ToSignInput, UnspentOutput } from "../types";
export declare function splitInscriptionUtxo({ btcUtxos, assetUtxo, network, changeAddress, feeRate, enableRBF, outputValue, }: {
    btcUtxos: UnspentOutput[];
    assetUtxo: UnspentOutput;
    network: bitcoin.Network;
    changeAddress: string;
    feeRate?: number;
    enableRBF?: boolean;
    outputValue?: number;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
    splitedCount: number;
};
