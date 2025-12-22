import { Awaitable } from "@/common/types/awaitable.ts";

export interface EncryptionAdapter {
  encrypt(plain: string): Awaitable<string>;
  decrypt(cipher: string): Awaitable<string>;
}

export type PersistOptions = {
  storageKey?: string;
  persist?: boolean;
};

export type StoreState = Record<string, unknown>;
