import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  PrepareSendRequest,
  PrepareSendResponse,
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

export const prepareSend = async (
  params: PrepareSendRequest,
): Promise<PrepareSendResponse> => {
  return await callBackground<MessageType.PrepareSend>({
    type: MessageType.PrepareSend,
    ...params,
  });
};
