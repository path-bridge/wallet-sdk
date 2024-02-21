import BigNumber from "bignumber.js";
import { ECPair, bitcoin, ecc } from "./bitcoin-core";
import { AddressType } from "./types";

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return bitcoin.crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey])
  );
}

/**
 * Transform raw private key to taproot address private key
 */
export function tweakSigner(
  signer: bitcoin.Signer,
  opts: any = {}
): bitcoin.Signer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

/**
 * ECDSA signature validator
 */
export const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

/**
 * Schnorr signature validator
 */
export const schnorrValidator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean => {
  return ECPair.fromPublicKey(pubkey).verifySchnorr(msghash, signature);
};

/**
 * Transform satoshis to btc format
 */
export function satoshisToAmount(val: number) {
  const num = new BigNumber(val);
  return num.dividedBy(100000000).toFixed(8);
}

/**
 * Transform btc format to satoshis
 */
export function amountToSaothis(val: any) {
  const num = new BigNumber(val);
  return num.multipliedBy(100000000).toNumber();
}



// export function getAddressType(address: string, network: bitcoin.Network): AddressType {
//   let decodeBase58: bitcoin.address.Base58CheckResult | undefined;
//   let decodeBech32: bitcoin.address.Bech32Result | undefined;
//   try {
//     decodeBase58 = bitcoin.address.fromBase58Check(address);
//   } catch (e) { }

//   if (decodeBase58) {
//     if (decodeBase58.version === network.pubKeyHash)
//       return AddressType.P2PKH
//     if (decodeBase58.version === network.scriptHash)
//       return AddressType.P2SH_P2WPKH
//   } else {
//     try {
//       decodeBech32 = bitcoin.address.fromBech32(address);
//     } catch (e) { }

//     if (decodeBech32) {
//       if (decodeBech32.prefix !== network.bech32)
//         throw new Error(address + ' has an invalid prefix');
//       if (decodeBech32.version === 0) {
//         return AddressType.P2WPKH
//       } else if (decodeBech32.version === 1) {
//         return AddressType.P2TR
//       }
//     }
//   }
//   return AddressType.P2PKH
// }