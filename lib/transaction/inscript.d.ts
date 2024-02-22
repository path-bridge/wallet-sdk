/// <reference types="node" />
import { bitcoin } from "../bitcoin-core";
import { UnspentOutput } from "../types";
export interface Inscription {
    contentType: string;
    content: string;
    revealAddr: string;
}
export interface CommitTxData {
    scriptTaproot: bitcoin.payments.Payment;
    tapLeafScript: {
        leafVersion: number;
        script: Buffer;
        controlBlock: any;
    };
    outputAmount?: number;
}
export declare class DummySigner implements bitcoin.Signer {
    publicKey: Buffer;
    network?: bitcoin.networks.Network;
    constructor(publicKey: Buffer);
    sign(hash: Buffer, lowR?: boolean): Buffer;
    signSchnorr(hash: Buffer): Buffer;
    getPublicKey(): Buffer;
}
export declare function createCommitTxData(network: bitcoin.Network, publicKey: Buffer, inscription: Inscription): {
    scriptTaproot: bitcoin.payments.Payment;
    tapLeafScript: {
        leafVersion: number;
        script: Buffer;
        controlBlock: any;
    };
};
export declare function estimateRevealTxSize(network: bitcoin.Network, publicKey: Buffer, commitTxData: CommitTxData, toAddress: string, amount: number): number;
export declare function buildCommitTx(network: bitcoin.Network, publicKey: Buffer, commitTxDatas: CommitTxData[], inscriptions: Inscription[], unspents: UnspentOutput[], changeAddress: string, feeRate: number): void;
export declare function buildRevealTx(network: bitcoin.Network, commitTxData: CommitTxData, inscription: Inscription, commitTx: bitcoin.Transaction, index?: number): bitcoin.Psbt;
export declare function signRevealTx(signer: bitcoin.Signer, commitTxData: CommitTxData, psbt: bitcoin.Psbt): bitcoin.Transaction;
