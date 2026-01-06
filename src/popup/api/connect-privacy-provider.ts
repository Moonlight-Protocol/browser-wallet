import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import {
  ConnectPrivacyProviderRequest,
  ConnectPrivacyProviderResponse,
} from "@/background/handlers/private/connect-privacy-provider.types.ts";

export const connectPrivacyProvider = async (
  params: ConnectPrivacyProviderRequest["payload"]
): Promise<ConnectPrivacyProviderResponse["payload"]> => {
  const response = await callBackground<MessageType.ConnectPrivacyProvider>(
    {
      type: MessageType.ConnectPrivacyProvider,
      payload: params,
    },
    {
      timeoutMs: 30_000, // Just needs to get the challenge, not wait for signing
    }
  );
  return response.payload;
};
