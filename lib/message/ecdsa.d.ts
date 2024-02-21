import { ECPairInterface } from "ecpair";
export declare function signMessageOfECDSA(privateKey: ECPairInterface, text: string): any;
export declare function verifyMessageOfECDSA(publicKey: string, text: string, sig: string): any;
