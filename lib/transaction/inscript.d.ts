/// <reference types="node" />
import { bitcoin } from "../bitcoin-core";
import { NetworkType } from "../network";
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
export declare function createCommitTxData(networkType: NetworkType, publicKey: Buffer, inscription: Inscription): {
    scriptTaproot: bitcoin.payments.Payment;
    tapLeafScript: {
        leafVersion: number;
        script: Buffer;
        controlBlock: any;
    };
};
export declare function estimateRevealTxSize(networkType: NetworkType, publicKey: Buffer, commitTxData: CommitTxData, toAddress: string, amount: number): number;
export declare function buildCommitTx(networkType: NetworkType, publicKey: Buffer, commitTxDatas: CommitTxData[], inscriptions: Inscription[], unspents: UnspentOutput[], changeAddress: string, feeRate: number): void;
export declare function buildRevealTx(networkType: NetworkType, commitTxData: CommitTxData, inscription: Inscription, commitTx: bitcoin.Transaction, index?: number): bitcoin.Psbt;
export declare function signRevealTx(signer: bitcoin.Signer, commitTxData: CommitTxData, psbt: bitcoin.Psbt): bitcoin.Transaction;
