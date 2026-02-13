import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  ReceiveRequest,
  ReceiveResponse,
} from "@/background/handlers/private/receive.types.ts";

export const receive = async (
  params: ReceiveRequest,
): Promise<ReceiveResponse> => {
  return await callBackground<MessageType.Receive>({
    type: MessageType.Receive,
    ...params,
  });
};
