import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export async function submitEntityKyc(params: {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  password: string;
  name: string;
  jurisdictions?: string[];
}): Promise<void> {
  const res = await callBackground({
    type: MessageType.SubmitEntityKyc,
    network: params.network,
    channelId: params.channelId,
    providerId: params.providerId,
    accountId: params.accountId,
    password: params.password,
    name: params.name,
    jurisdictions: params.jurisdictions,
  });

  if ("ok" in res && res.ok === false) {
    throw new ApiError(
      res.error.message ?? "Failed to submit KYC",
      res.error.code,
    );
  }
}
