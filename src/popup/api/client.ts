import browser from "webextension-polyfill";
import { MessageType, type ResponseFor } from "@/background/messages.ts";
import { DEV } from "@/common/dev-flag.ts";

export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function callBackground<T extends MessageType>(
  message: { type: T } & Record<string, unknown>,
  options?: { timeoutMs?: number },
): Promise<ResponseFor<T>> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const startedAt = Date.now();
  if (DEV) {
    console.log("[popup] callBackground:start", {
      type: message.type,
      timeoutMs,
    });
  }

  let timer: number | undefined;
  try {
    const res = (await Promise.race([
      browser.runtime.sendMessage(message),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new ApiError(
              "Background did not respond (timeout)",
              "BACKGROUND_TIMEOUT",
            ),
          );
        }, timeoutMs) as unknown as number;
      }),
    ])) as ResponseFor<T>;

    if (DEV) {
      console.log("[popup] callBackground:ok", {
        type: message.type,
        ms: Date.now() - startedAt,
      });
    }

    return res;
  } catch (err) {
    if (DEV) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("[popup] callBackground:fail", {
        type: message.type,
        message: msg,
        ms: Date.now() - startedAt,
      });
    }
    throw err;
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
