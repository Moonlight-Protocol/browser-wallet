import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { enqueueSync } from "@/background/chain/engine.ts";

export const handleSyncChainState = (
  message: MessageFor<MessageType.SyncChainState>
): ResponseFor<MessageType.SyncChainState> => {
  enqueueSync(
    message.items.map((i) => ({
      network: i.network,
      publicKey: i.publicKey,
      priority: i.priority === true,
    })),
    { onlyIfStale: message.onlyIfStale }
  );

  return {
    type: MessageType.SyncChainState,
    ok: true,
  };
};
