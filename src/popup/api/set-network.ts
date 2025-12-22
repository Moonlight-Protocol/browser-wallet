import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function setNetwork(network: "mainnet" | "testnet" | "futurenet") {
  const res = await callBackground({ type: MessageType.SetNetwork, network });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to set network",
      res.error.code
    );
  }
}
