import { createStore, withProps, type Store, type StoreDef } from "@ngneat/elf";
import { persistState, type StateStorage } from "@ngneat/elf-persist-state";
import browser from "webextension-polyfill";
import { PersistOptions, StoreState } from "@/persistence/types.ts";

const DEFAULT_STORAGE_KEY_SUFFIX = "@store";

export class PersistedStore<State extends StoreState> {
  readonly store: Store<StoreDef<State>, State>;
  protected destroyPersistence?: () => void;
  protected readonly storageKey: string;
  protected readonly fallback: State;

  constructor(name: string, initialState: State, options: PersistOptions = {}) {
    this.storageKey =
      options.storageKey ?? `${name}${DEFAULT_STORAGE_KEY_SUFFIX}`;
    this.fallback = initialState;

    // Elf's createStore returns a Store whose StoreDef is derived from props factories.
    // Cast it to StoreDef<State> so downstream reducers infer State correctly.
    this.store = createStore(
      { name },
      withProps<State>(initialState)
    ) as unknown as Store<StoreDef<State>, State>;
    this.destroyPersistence = this.setupPersistence(options.persist ?? true);
  }

  destroy() {
    this.destroyPersistence?.();
  }

  async flush(): Promise<void> {
    const value = this.store.getValue() as State;
    const raw = await this.safeSerialize(value);
    await browser.storage.local.set({ [this.storageKey]: raw });
  }

  async hydrateFromStorage(): Promise<void> {
    try {
      const result = await browser.storage.local.get(this.storageKey);
      const raw = result[this.storageKey];

      if (typeof raw === "string" && raw.length > 0) {
        const next = await this.safeDeserialize(raw);
        this.setState(next);
        return;
      }

      // Be resilient to older formats where storage may have been saved
      // as a plain object instead of a string.
      if (raw && typeof raw === "object") {
        this.setState(raw as State);
      }
    } catch {
      // Ignore hydration errors and keep fallback state.
    }
  }

  protected setupPersistence(persist: boolean) {
    if (!persist) return undefined;

    const persistor = persistState(this.store, {
      key: this.storageKey,
      storage: this.toPersistStorage(),
    });

    return () => persistor.unsubscribe();
  }

  protected toPersistStorage(): StateStorage {
    return {
      getItem: async (key: string) => {
        const result = await browser.storage.local.get(key);
        const raw = result[key];
        if (typeof raw !== "string") return undefined;
        return this.safeDeserialize(raw);
      },
      setItem: async (key: string, value: State) => {
        const raw = await this.safeSerialize(value);
        await browser.storage.local.set({ [key]: raw });
        return undefined;
      },
      removeItem: async (key: string) => {
        await browser.storage.local.remove(key);
        return undefined;
      },
      clear: async () => {
        await browser.storage.local.clear();
        return undefined;
      },
    } as StateStorage;
  }

  protected setState(next: State) {
    this.store.update(() => next);
  }

  protected safeSerialize(value: State): Promise<string> {
    try {
      return Promise.resolve(JSON.stringify(value));
    } catch (error) {
      console.error("Persist serialize failed", error);
      try {
        return Promise.resolve(JSON.stringify(this.fallback));
      } catch {
        return Promise.resolve(JSON.stringify(this.fallback));
      }
    }
  }

  protected safeDeserialize(value: string): Promise<State> {
    if (!value) return Promise.resolve(this.fallback);
    try {
      return Promise.resolve(JSON.parse(value) as State);
    } catch (error) {
      console.error("Persist deserialize failed", error);
      return Promise.resolve(this.fallback);
    }
  }
}
