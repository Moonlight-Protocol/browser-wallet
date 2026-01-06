import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { RequestSigningRequest } from "@/background/handlers/signing/request-signing.types.ts";

export const requestSigning = async (
  payload: RequestSigningRequest["payload"]
) => {
  return callBackground({
    type: MessageType.RequestSigning,
    payload,
  });
};
