import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type { GetPrivacyProviderAuthChallengeResponse } from "@/background/handlers/private/get-privacy-provider-auth-challenge.types.ts";

export const getPrivacyProviderAuthChallenge = async (params: {
  providerUrl: string;
  publicKey: string;
}): Promise<GetPrivacyProviderAuthChallengeResponse> => {
  const response =
    await callBackground<MessageType.GetPrivacyProviderAuthChallenge>({
      type: MessageType.GetPrivacyProviderAuthChallenge,
      ...params,
    });
  return response;
};
