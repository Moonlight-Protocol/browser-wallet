import { MessageType } from "@/background/messages.ts";
import type { FundWithFriendbotResponse } from "@/background/handlers/chain/fund-with-friendbot.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

export async function fundWithFriendbot(params: {
  network: ChainNetwork;
  publicKey: Ed25519PublicKey;
}) {
  const res = (await callBackground({
    type: MessageType.FundWithFriendbot,
    network: params.network,
    publicKey: params.publicKey,
  })) as FundWithFriendbotResponse;

  if ("ok" in res && res.ok === true) return res;

  if ("error" in res) {
    throw new ApiError(
      res.error.message ?? "Failed to fund account",
      res.error.code,
    );
  }

  throw new ApiError("Failed to fund account", "UNKNOWN");
}
