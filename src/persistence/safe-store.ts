import { EncryptionAdapter } from "@/persistence/types.ts";
import { PersistedStore } from "@/persistence/store.ts";
import browser from "webextension-polyfill";

type StoreState = Record<string, unknown>;

type EncryptedOptions = {
  storageKey?: string;
  persist?: boolean;
};

export class EncryptedPersistedStore<
  State extends StoreState
> extends PersistedStore<State> {
  private encryption?: EncryptionAdapter;
  private readonly persistRequested: boolean;

  constructor(
    name: string,
    initialState: State,
    encryption: EncryptionAdapter | undefined,
    options: EncryptedOptions = {}
  ) {
    const persistRequested = options.persist ?? true;
    const persistNow = Boolean(encryption) && persistRequested;

    super(name, initialState, { ...options, persist: persistNow });
    this.encryption = encryption;
    this.persistRequested = persistRequested;
  }

  isLocked(): boolean {
    return !this.encryption;
  }

  lock() {
    this.encryption = undefined;
    this.destroyPersistence?.();
    this.destroyPersistence = undefined;
    this.setState(this.fallback);
  }

  async unlock(encryption: EncryptionAdapter) {
    this.encryption = encryption;

    const result = await browser.storage.local.get(this.storageKey);
    const raw = result[this.storageKey];
    if (typeof raw === "string" && raw.length > 0) {
      const next = await this.safeDeserialize(raw);
      this.setState(next);
    }

    if (!this.persistRequested) return;

    this.destroyPersistence?.();
    this.destroyPersistence = this.setupPersistence(true);
  }

  protected override async safeSerialize(value: State) {
    if (!this.encryption) {
      throw new Error("EncryptedPersistedStore is locked");
    }
    const json = await super.safeSerialize(value);
    return this.encryption.encrypt(json);
  }

  protected override async safeDeserialize(value: string) {
    if (!this.encryption) {
      return super.safeDeserialize("");
    }
    const json = await this.encryption.decrypt(value);
    return super.safeDeserialize(json);
  }
}
