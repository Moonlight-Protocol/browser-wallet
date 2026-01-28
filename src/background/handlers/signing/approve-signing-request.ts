import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager, unlockVault, vault } from "@/background/session.ts";
import { Keys } from "@/keys/keys.ts";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";

export const handleApproveSigningRequest: Handler<
  MessageType.ApproveSigningRequest
> = async (message) => {
  const { requestId, password } = message;
  const request = signingManager.getRequest(requestId);

  if (!request) {
    throw new Error("Signing request not found");
  }

  // 1. Validate password and unlock vault temporarily to get the key
  await unlockVault({ password });

  // 2. Find the account
  // Note: We need to access the store state AFTER waitng for unlock/decryption
  // The VaultStore might behave asyncly upon unlock to load from storage.
  // However, `vault.unlock` is async and handles the hydration.

  const state = vault.store.getValue();
  const found = state.wallets
    .flatMap((w) => w.accounts.map((a) => ({ wallet: w, account: a })))
    .find((x) => x.account.id === request.accountId);

  if (!found) {
    throw new Error("Account not found");
  }

  // 3. Derive the keypair
  let keypair;
  if (found.wallet.type === "secret") {
    if (found.account.type === "imported") {
      keypair = Keys.keypairFromSecret(found.account.secret!);
    } else {
      throw new Error("Invalid account type for secret wallet");
    }
  } else {
    // Mnemonic
    keypair = await Keys.deriveStellarKeypairFromMnemonic(
      found.wallet.mnemonic,
      found.account.type === "derived" ? found.account.index : 0,
    );
  }

  // 4. Parse and Sign Transaction
  const networkConfig = getNetworkConfig(request.network);
  const passphrase = networkConfig.networkPassphrase;

  const transaction = TransactionBuilder.fromXDR(request.xdr, passphrase);
  transaction.sign(keypair);

  const signedXdr = transaction.toXDR();

  // 5. Cleanup and Resolve
  signingManager.resolveRequest(requestId, signedXdr);

  return {
    type: MessageType.ApproveSigningRequest,
    ok: true as const,
    signedXdr,
  };
};
