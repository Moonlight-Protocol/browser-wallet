import type { Ed25519PublicKey } from "@colibri/core";
import type { NetworkConfig } from "@colibri/core";

export type AccountActivationStatus = "created" | "not_created" | "unknown";

async function rpcGetAccount(params: {
  rpcUrl: string;
  publicKey: Ed25519PublicKey;
}) {
  const res = await fetch(params.rpcUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccount",
      params: {
        address: String(params.publicKey),
      },
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`RPC invalid JSON: ${text.slice(0, 500)}`);
  }

  if (typeof json !== "object" || json === null) {
    throw new Error(`RPC invalid response: ${text.slice(0, 500)}`);
  }

  const obj = json as Record<string, unknown>;
  const err = obj["error"];
  if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;
    const errMsg = errObj["message"];
    if (typeof errMsg === "string") throw new Error(errMsg);
    throw new Error(`RPC error: ${JSON.stringify(errObj).slice(0, 500)}`);
  }

  return obj["result"];
}

export async function checkAccountActivationStatus(params: {
  networkConfig: NetworkConfig;
  publicKey: Ed25519PublicKey;
}): Promise<AccountActivationStatus> {
  const { networkConfig, publicKey } = params;

  try {
    const rpcUrl = String(networkConfig.rpcUrl);
    const result = await rpcGetAccount({ rpcUrl, publicKey });
    return result ? "created" : "unknown";
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();

    // Missing account signals.
    if (lower.includes("not found")) return "not_created";
    if (lower.includes("does not exist")) return "not_created";
    if (lower.includes("account not found")) return "not_created";
    if (lower.includes("resource missing")) return "not_created";

    // Everything else (network/CORS/invalid params/etc) isn't a reliable
    // indicator of non-existence.
    return "unknown";
  }
}
