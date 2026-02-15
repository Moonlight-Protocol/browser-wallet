import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  SendRequest,
  SendResponse,
} from "@/background/handlers/private/send.types.ts";

export const send = async (
  params: SendRequest,
): Promise<SendResponse> => {
  return await callBackground<MessageType.Send>({
    type: MessageType.Send,
    ...params,
  });
};
