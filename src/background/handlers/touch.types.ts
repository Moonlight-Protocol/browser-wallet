import type { BackgroundError } from "@/background/types.ts";

export type TouchRequest = {
  ttlMs?: number;
};

export type TouchResponse =
  | { ok: true }
  | {
      ok: false;
      error: BackgroundError;
    };
