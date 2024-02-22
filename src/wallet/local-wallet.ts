import {
  publicKeyToAddress,
  publicKeyToScriptPk,
  scriptPkToAddress,
} from "../address";
import { ECPair, bitcoin } from "../bitcoin-core";
import { HdKeyring, SimpleKeyring } from "../keyring";
import { signMessageOfBIP322Simple } from "../message";
import {
  AddressType,
  AddressUserToSignInput,
  PublicKeyUserToSignInput,
  SignPsbtOptions,
  ToSignInput,
} from "../types";
import { toXOnly } from "../utils";
import { AbstractWallet } from "./abstract-wallet";

export class LocalWallet implements AbstractWallet {
  keyring: SimpleKeyring;
  address: string;
  pubkey: string;
  network: bitcoin.Network;
  addressType: AddressType;
  scriptPk: string;
  constructor(
    wif: string,
    addressType: AddressType = AddressType.P2WPKH,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ) {
    const keyPair = ECPair.fromWIF(wif, network);
    this.keyring = new SimpleKeyring([keyPair.privateKey.toString("hex")]);
    this.keyring.addAccounts(1);
    this.pubkey = keyPair.publicKey.toString("hex");
    this.address = publicKeyToAddress(this.pubkey, addressType, network);
    this.network = network;
    this.addressType = addressType;

    this.scriptPk = publicKeyToScriptPk(this.pubkey, addressType, network);
  }

  static fromMnemonic(
    addressType: AddressType,
    network: bitcoin.Network,
    mnemonic: string,
    passPhrase?: string,
    hdPath?: string
  ) {
    const keyring = new HdKeyring({ mnemonic, hdPath, passphrase: passPhrase });
    const keyPair = keyring.getAccounts()[0];
    const wallet = new LocalWallet(
      keyPair.privateKey.toString("hex"),
      addressType,
      network
    );
    return wallet;
  }

  static fromRandom(
    addressType: AddressType = AddressType.P2WPKH,
    network: bitcoin.Network = bitcoin.networks.bitcoin
  ) {
    const ecpair = ECPair.makeRandom({ network });
    const wallet = new LocalWallet(ecpair.toWIF(), addressType, network);
    return wallet;
  }

  getNetwork() {
    return this.network;
  }

  private formatOptionsToSignInputs(
    _psbt: string | bitcoin.Psbt,
    options?: SignPsbtOptions
  ) {
    const accountAddress = this.address;
    const accountPubkey = this.getPublicKey();

    let toSignInputs: ToSignInput[] = [];
    if (options && options.toSignInputs) {
      // We expect userToSignInputs objects to be similar to ToSignInput interface,
      // but we allow address to be specified in addition to publicKey for convenience.
      toSignInputs = options.toSignInputs.map((input) => {
        const index = Number(input.index);
        if (isNaN(index)) throw new Error("invalid index in toSignInput");

        if (
          !(input as AddressUserToSignInput).address &&
          !(input as PublicKeyUserToSignInput).publicKey
        ) {
          throw new Error("no address or public key in toSignInput");
        }

        if (
          (input as AddressUserToSignInput).address &&
          (input as AddressUserToSignInput).address != accountAddress
        ) {
          throw new Error("invalid address in toSignInput");
        }

        if (
          (input as PublicKeyUserToSignInput).publicKey &&
          (input as PublicKeyUserToSignInput).publicKey != accountPubkey
        ) {
          throw new Error("invalid public key in toSignInput");
        }

        const sighashTypes = input.sighashTypes?.map(Number);
        if (sighashTypes?.some(isNaN))
          throw new Error("invalid sighash type in toSignInput");

        return {
          index,
          publicKey: accountPubkey,
          sighashTypes,
          disableTweakSigner: input.disableTweakSigner,
        };
      });
    } else {


      const psbt =
        typeof _psbt === "string"
          ? bitcoin.Psbt.fromHex(_psbt as string, { network: this.network })
          : (_psbt as bitcoin.Psbt);
      psbt.data.inputs.forEach((v, index) => {
        let script: any = null;
        let value = 0;
        if (v.witnessUtxo) {
          script = v.witnessUtxo.script;
          value = v.witnessUtxo.value;
        } else if (v.nonWitnessUtxo) {
          const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
          const output = tx.outs[psbt.txInputs[index].index];
          script = output.script;
          value = output.value;
        }
        const isSigned = v.finalScriptSig || v.finalScriptWitness;
        if (script && !isSigned) {
          const address = scriptPkToAddress(script, this.network);
          if (accountAddress === address) {
            toSignInputs.push({
              index,
              publicKey: accountPubkey,
              sighashTypes: v.sighashType ? [v.sighashType] : undefined,
            });
          }
        }
      });
    }
    return toSignInputs;
  }

  signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions) {
    const _opts = opts || { autoFinalized: true, toSignInputs: [], };
    let _inputs: ToSignInput[] = this.formatOptionsToSignInputs(psbt, opts);

    if (_inputs.length == 0) {
      throw new Error("no input to sign");
    }

    psbt.data.inputs.forEach((v, index) => {
      const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
      const isP2TR =
        this.addressType === AddressType.P2TR ||
        this.addressType === AddressType.M44_P2TR;
      const lostInternalPubkey = !v.tapInternalKey;
      // Special measures taken for compatibility with certain applications.
      if (isNotSigned && isP2TR && lostInternalPubkey) {
        const tapInternalKey = toXOnly(Buffer.from(this.pubkey, "hex"));
        const { output } = bitcoin.payments.p2tr({
          internalPubkey: tapInternalKey,
          network: this.network,
        });
        if (v.witnessUtxo?.script.toString("hex") == output?.toString("hex")) {
          v.tapInternalKey = tapInternalKey;
        }
      }
    });

    psbt = this.keyring.signTransaction(psbt, _inputs);
    if (_opts.autoFinalized) {
      psbt.finalizeAllInputs();
    }
    return psbt;
  }

  getPublicKey(): string {
    const pubkeys = this.keyring.getAccounts();
    return pubkeys[0];
  }

  signMessage(
    text: string,
    type: "bip322-simple" | "ecdsa"
  ): string {
    if (type === "bip322-simple") {
      return signMessageOfBIP322Simple({
        message: text,
        address: this.address,
        network: this.network,
        wallet: this,
      });
    } else {
      const pubkey = this.getPublicKey();
      return this.keyring.signMessage(pubkey, text);
    }
  }
}
