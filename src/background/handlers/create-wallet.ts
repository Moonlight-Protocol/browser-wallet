import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { Keys } from "@/keys/keys.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export const handleCreateWallet = async (
  message: MessageFor<MessageType.CreateWallet>
): Promise<ResponseFor<MessageType.CreateWallet>> => {
  const mnemonic = Keys.generateMnemonic();
  const account = await Keys.deriveStellarAccountFromMnemonic(mnemonic, 0);
  const publicKey = account.publicKey as Ed25519PublicKey;

  return {
    type: MessageType.CreateWallet,
    firstPublicKey: publicKey,
    mnemonic,
  };
};
