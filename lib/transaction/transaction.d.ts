/// <reference types="node" />
import { bitcoin } from "../bitcoin-core";
import { ToSignInput, UnspentOutput } from "../types";
interface TxInput {
    data: {
        hash: string;
        index: number;
        witnessUtxo: {
            value: number;
            script: Buffer;
        };
        tapInternalKey?: Buffer;
    };
    utxo: UnspentOutput;
}
interface TxOutput {
    address?: string;
    script?: Buffer;
    value: number;
}
/**
 * Transaction
 */
export declare class Transaction {
    private utxos;
    inputs: TxInput[];
    outputs: TxOutput[];
    private changeOutputIndex;
    changedAddress: string;
    private network;
    private feeRate;
    private enableRBF;
    private _cacheNetworkFee;
    private _cacheBtcUtxos;
    private _cacheToSignInputs;
    constructor(network: bitcoin.Network, feeRate: number, changedAddress: string, enableRBF?: boolean);
    addInputs(utxos: UnspentOutput[]): void;
    addInput(utxo: UnspentOutput): void;
    removeLastInput(): void;
    getTotalInput(): number;
    getTotalOutput(): number;
    getUnspent(): number;
    calNetworkFee(): number;
    addOutput(addressOrscript: string | Buffer, value: number): void;
    getOutput(index: number): TxOutput;
    addChangeOutput(value: number): void;
    getChangeOutput(): TxOutput;
    getChangeAmount(): number;
    removeChangeOutput(): void;
    removeRecentOutputs(count: number): void;
    toPsbt(): bitcoin.Psbt;
    clone(): Transaction;
    createEstimatePsbt(): bitcoin.Psbt;
    private selectBtcUtxos;
    addSufficientUtxosForFee(btcUtxos: UnspentOutput[], forceAsFee?: boolean): ToSignInput[];
    dumpTx(psbt: any): Promise<void>;
}
export {};
