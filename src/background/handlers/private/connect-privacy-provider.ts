import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { privateChannels, signingManager } from "@/background/session.ts";
import { PrivacyProviderClient } from "@/background/services/privacy-provider-client.ts";

export const handleConnectPrivacyProvider: Handler<
  MessageType.ConnectPrivacyProvider
> = async (message) => {
  const { channelId, providerId, providerUrl, accountId, publicKey, network } =
    message;

  // 1. Get Authentication Challenge from Provider
  const client = new PrivacyProviderClient(providerUrl);
  const challenge = await client.getAuthChallenge(publicKey);

  // 2. Create Signing Request
  const request = signingManager.createRequest({
    type: "auth-challenge",
    xdr: challenge.data.challenge,
    accountId,
    network,
  });

  // 3. Start async completion flow (don't block the response)
  // This runs in background and completes when user approves
  (async () => {
    try {
      const signedXdr = await signingManager.waitForResult(request.id);

      // 4. Submit Signed Challenge to Provider
      const authResponse = await client.postAuth(signedXdr);

      // 5. Save Session
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      await privateChannels.setProviderSession(
        network,
        channelId,
        providerId,
        accountId,
        {
          token: authResponse.token,
          expiresAt,
        }
      );

      // 6. Auto-select the provider
      await privateChannels.setSelectedProvider(network, channelId, providerId);
    } catch (err) {
      console.error("[ConnectPrivacyProvider] Async completion failed:", err);
    }
  })();

  // Return immediately with the signing request ID
  // The popup will navigate to the signing page
  return {
    type: MessageType.ConnectPrivacyProvider,
    signingRequestId: request.id,
  };
};
