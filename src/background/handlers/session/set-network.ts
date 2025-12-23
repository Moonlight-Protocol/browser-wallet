import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta } from "@/background/session.ts";

export const handleSetNetwork = async (
  message: MessageFor<MessageType.SetNetwork>
): Promise<ResponseFor<MessageType.SetNetwork>> => {
  const network = message.network;

  // Custom is intentionally not supported yet in the UI.
  // Keep a defensive check here anyway.
  if (
    network !== "mainnet" &&
    network !== "testnet" &&
    network !== "futurenet" &&
    network !== "custom"
  ) {
    return {
      type: MessageType.SetNetwork,
      ok: false,
      error: { code: "UNKNOWN", message: "Invalid network" },
    };
  }

  meta.setLastSelectedNetwork(network);
  await meta.flush();

  // When switching network we keep selection unchanged.

  return { type: MessageType.SetNetwork, ok: true };
};
