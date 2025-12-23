import type { BackgroundError } from "@/background/types.ts";

export type UnlockRequest = {
  password: string;
  ttlMs?: number;
};

export type UnlockResponse =
  | { ok: true }
  | { ok: false; error: BackgroundError };
