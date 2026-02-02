import { MessageType } from "@/background/messages.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function importWallet(params: {
  mnemonic: string;
  name?: string;
}): Promise<{ walletId: string; firstPublicKey: string }> {
  const res = await callBackground({
    type: MessageType.ImportWallet,
    mnemonic: params.mnemonic,
    name: params.name,
  });

  if ("error" in res) {
    const fallbackMessage = res.error.code === "LOCKED"
      ? "Wallet is locked. Unlock to continue."
      : res.error.code === "INVALID_MNEMONIC"
      ? "Invalid recovery phrase."
      : "Failed to import wallet";

    throw new ApiError(res.error.message ?? fallbackMessage, res.error.code);
  }

  return { walletId: res.walletId, firstPublicKey: res.firstPublicKey };
}
