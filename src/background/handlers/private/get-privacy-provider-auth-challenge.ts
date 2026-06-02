import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { PrivacyProviderClient } from "@/background/services/privacy-provider-client.ts";

export const handleGetPrivacyProviderAuthChallenge: Handler<
  MessageType.GetPrivacyProviderAuthChallenge
> = async (message) => {
  const { providerUrl, publicKey } = message;

  // SEP-10 challenge is global (not per-PP), so an empty pubkey is fine here.
  const client = new PrivacyProviderClient(providerUrl, "");
  const response = await client.getAuthChallenge(publicKey);

  return {
    type: MessageType.GetPrivacyProviderAuthChallenge,
    ...response,
  };
};
