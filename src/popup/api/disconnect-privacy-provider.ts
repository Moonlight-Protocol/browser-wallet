import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import type {
  DisconnectPrivacyProviderRequest,
  DisconnectPrivacyProviderResponse,
} from "@/background/handlers/private/disconnect-privacy-provider.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export const disconnectPrivacyProvider = async (params: {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
}): Promise<void> => {
  await callBackground<MessageType.DisconnectPrivacyProvider>({
    type: MessageType.DisconnectPrivacyProvider,
    payload: params,
  });
};
