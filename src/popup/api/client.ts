import browser from "webextension-polyfill";
import { MessageType, type ResponseFor } from "@/background/messages.ts";

export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function callBackground<T extends MessageType>(
  message: { type: T } & Record<string, unknown>
): Promise<ResponseFor<T>> {
  return (await browser.runtime.sendMessage(message)) as ResponseFor<T>;
}
