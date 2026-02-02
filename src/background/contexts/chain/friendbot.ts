import {
  type Ed25519PublicKey,
  initializeWithFriendbot,
  type NetworkConfig,
} from "@colibri/core";

export async function requestFriendbotFunding(params: {
  networkConfig: NetworkConfig;
  publicKey: Ed25519PublicKey;
}): Promise<void> {
  const { networkConfig, publicKey } = params;

  const friendbotUrl = networkConfig.friendbotUrl;
  if (!friendbotUrl) {
    throw new Error("Friendbot URL not configured for this network");
  }

  await initializeWithFriendbot(String(friendbotUrl), publicKey);
}
