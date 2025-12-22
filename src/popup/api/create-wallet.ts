import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function createWallet(params?: { name?: string }): Promise<{
  firstPublicKey: string;
  mnemonic: string;
}> {
  const res = await callBackground({
    type: MessageType.CreateWallet,
    name: params?.name,
  });

  if ("error" in res) {
    throw new ApiError(
      res.error.message ?? "Failed to create wallet",
      res.error.code
    );
  }

  return {
    firstPublicKey: res.firstPublicKey,
    mnemonic: res.mnemonic,
  };
}
