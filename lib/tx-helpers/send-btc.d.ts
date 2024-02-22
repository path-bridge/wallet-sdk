import { bitcoin } from "../bitcoin-core";
import { ToSignInput, UnspentOutput } from "../types";
export declare function sendBTC({ btcUtxos, tos, network, changeAddress, feeRate, enableRBF, }: {
    btcUtxos: UnspentOutput[];
    tos: {
        address: string;
        satoshis: number;
    }[];
    network: bitcoin.Network;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
};
export declare function sendAllBTC({ btcUtxos, toAddress, network, feeRate, enableRBF, }: {
    btcUtxos: UnspentOutput[];
    toAddress: string;
    network: bitcoin.Network;
    feeRate: number;
    enableRBF?: boolean;
}): {
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
};
