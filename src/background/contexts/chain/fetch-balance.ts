import type { Ed25519PublicKey } from "@colibri/core";
import type { NetworkConfig } from "@colibri/core";
import { Keypair, xdr } from "@stellar/stellar-sdk";
import { getRpcServer } from "@/background/contexts/chain/network.ts";

type AssetDetails =
  | { code: "XLM"; issuer: never }
  | { code: string; issuer: Ed25519PublicKey };

export async function fetchStellarAssetBalance(
  networkConfig: NetworkConfig,
  asset: AssetDetails,
  publicKey: Ed25519PublicKey,
): Promise<bigint> {
  const server = getRpcServer(networkConfig);

  // For native XLM, read the account ledger entry directly.
  // This works on all networks including local standalone where
  // the native SAC isn't deployed.
  if (asset.code === "XLM" && !asset.issuer) {
    const accountId = Keypair.fromPublicKey(publicKey).xdrAccountId();
    const key = xdr.LedgerKey.account(
      new xdr.LedgerKeyAccount({ accountId }),
    );

    const response = await server.getLedgerEntries(key);
    if (!response.entries || response.entries.length === 0) {
      return 0n;
    }

    const entry = response.entries[0];
    const accountEntry = entry.val.account();
    return BigInt(accountEntry.balance().toString());
  }

  // For non-native assets, use SAC simulation via Soroban.
  const { Asset, nativeToScVal, scValToNative, Contract, TransactionBuilder } =
    await import("@stellar/stellar-sdk");
  const stellarAsset = new Asset(asset.code, asset.issuer);
  const contractId = stellarAsset.contractId(networkConfig.networkPassphrase);
  const contract = new Contract(contractId);

  const account = await server.getAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: networkConfig.networkPassphrase,
  })
    .addOperation(
      contract.call("balance", nativeToScVal(publicKey, { type: "address" })),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if ("error" in sim) {
    throw new Error(`Balance simulation failed: ${sim.error}`);
  }
  // deno-lint-ignore no-explicit-any
  const results = (sim as any).result?.retval;
  if (!results) {
    throw new Error("No return value from balance simulation");
  }

  return scValToNative(results) as bigint;
}
