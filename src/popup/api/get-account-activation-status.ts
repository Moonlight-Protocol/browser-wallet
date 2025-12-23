import { MessageType } from "@/background/messages.ts";
import type { GetAccountActivationStatusResponse } from "@/background/handlers/chain/get-account-activation-status.types.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export async function getAccountActivationStatus(params: {
  network: ChainNetwork;
  publicKey: Ed25519PublicKey;
}) {
  const res = (await callBackground({
    type: MessageType.GetAccountActivationStatus,
    network: params.network,
    publicKey: params.publicKey,
  })) as GetAccountActivationStatusResponse;

  return res;
}
