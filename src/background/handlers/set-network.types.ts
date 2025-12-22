import type { BackgroundError } from "@/background/types.ts";

export type SetNetworkRequest = {
  network: "mainnet" | "testnet" | "futurenet" | "custom";
};

export type SetNetworkResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: BackgroundError;
    };
