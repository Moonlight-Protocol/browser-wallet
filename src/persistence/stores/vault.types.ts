import type { Ed25519PublicKey, Ed25519SecretKey } from "@colibri/core";
export type VaultState = {
  wallets: VaultWallet[];
};

export type VaultWallet = MnemonicWallet | ImportedSecretWallet;

export type MnemonicWallet = {
  id: string;
  type: "mnemonic";
  name?: string;
  mnemonic: string;
  accounts: DerivedAccount[];
};

export type DerivedAccount = {
  id: string;
  type: "derived";
  name?: string;
  publicKey: Ed25519PublicKey;
  derivationPath: string;
  index: number;
};

export type ImportedSecretWallet = {
  id: string;
  type: "secret";
  name?: string;
  accounts: ImportedSecretAccount[];
};

export type ImportedSecretAccount = {
  id: string;
  type: "imported";
  name?: string;
  publicKey: Ed25519PublicKey;
  secret: Ed25519SecretKey;
};
