import { StellarAssetContract, type Ed25519PublicKey } from "@colibri/core";
import type { NetworkConfig } from "@colibri/core";

type AssetDetails =
  | { code: "XLM"; issuer: never }
  | { code: string; issuer: Ed25519PublicKey };

export function fetchStellarAssetBalance(
  networkConfig: NetworkConfig,
  asset: AssetDetails,
  publicKey: Ed25519PublicKey
): Promise<bigint> {
  let sac: StellarAssetContract;

  if (asset.code === "XLM" && !asset.issuer) {
    sac = StellarAssetContract.NativeXLM(networkConfig);
  } else {
    sac = new StellarAssetContract({
      code: asset.code,
      issuer: asset.issuer as Ed25519PublicKey,
      networkConfig: networkConfig,
    });
  }

  return sac.balance({ id: publicKey });
}
