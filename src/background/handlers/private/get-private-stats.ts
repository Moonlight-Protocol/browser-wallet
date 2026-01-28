import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateUtxos } from "@/background/session.ts";

export const handleGetPrivateStats = (
  message: MessageFor<MessageType.GetPrivateStats>,
): ResponseFor<MessageType.GetPrivateStats> => {
  const stats = privateUtxos.getStats({
    network: message.network,
    accountId: message.accountId,
    channelId: message.channelId,
  });

  return {
    type: MessageType.GetPrivateStats,
    ok: true,
    stats,
  };
};
