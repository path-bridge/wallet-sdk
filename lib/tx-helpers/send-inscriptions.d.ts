import { bitcoin } from "../bitcoin-core";
import { ToSignInput, UnspentOutput } from "../types";
export declare function sendInscriptions({ assetUtxos, btcUtxos, toAddress, network, changeAddress, feeRate, enableRBF, }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    toAddress: string;
    network: bitcoin.Network;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
};
