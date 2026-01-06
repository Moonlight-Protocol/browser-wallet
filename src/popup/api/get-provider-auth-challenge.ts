import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type {
  GetProviderAuthChallengeRequest,
  GetProviderAuthChallengeResponse,
} from "@/background/handlers/private/get-provider-auth-challenge.types.ts";

export const getProviderAuthChallenge = async (params: {
  providerUrl: string;
  publicKey: string;
}): Promise<GetProviderAuthChallengeResponse["payload"]> => {
  const response = await callBackground<MessageType.GetProviderAuthChallenge>({
    type: MessageType.GetProviderAuthChallenge,
    payload: params,
  });
  return response.payload;
};
