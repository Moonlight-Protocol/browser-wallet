import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { getChainState } from "@/background/chain/engine.ts";

export const handleGetChainState = (
  message: MessageFor<MessageType.GetChainState>,
): ResponseFor<MessageType.GetChainState> => {
  return {
    type: MessageType.GetChainState,
    ...getChainState({
      network: message.network,
      publicKey: message.publicKey,
    }),
  };
};
