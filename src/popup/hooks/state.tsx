import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { getStatus, type PopupStatus } from "@/popup/api/get-status.ts";
import { getAccounts } from "@/popup/api/get-accounts.ts";
import { touch } from "@/popup/api/touch.ts";
import { DEV } from "@/common/dev-flag.ts";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";

export type PopupRoute = "home" | "import" | "settings" | "private-add-channel";

type PopupState = {
  loading: boolean;
  error?: string;
  status?: PopupStatus;
  accounts?: SafeAccount[];
  accountsLoading: boolean;
  accountsError?: string;
  route: PopupRoute;
};

type PopupActions = {
  refreshStatus: () => Promise<void>;
  goHome: () => void;
  goImport: () => void;
  goSettings: () => void;
  goPrivateAddChannel: () => void;
};

type PopupContextValue = {
  state: PopupState;
  actions: PopupActions;
};

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export function PopupProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<PopupState>({
    loading: true,
    accountsLoading: false,
    route: "home",
  });

  const lastTouchAtRef = useRef(0);

  const maybeTouch = () => {
    const unlocked = state.status?.unlocked ?? false;
    if (!unlocked) return;

    const now = Date.now();
    // Throttle keep-alive calls.
    if (now - lastTouchAtRef.current < 5_000) return;
    lastTouchAtRef.current = now;

    touch({ ttlMs: 30 * 60 * 1000 }).catch(() => undefined);
  };

  const goHome = () => setState((prev) => ({ ...prev, route: "home" }));
  const goImport = () => setState((prev) => ({ ...prev, route: "import" }));
  const goSettings = () => setState((prev) => ({ ...prev, route: "settings" }));
  const goPrivateAddChannel = () =>
    setState((prev) => ({ ...prev, route: "private-add-channel" }));

  const refreshStatus = async () => {
    const startedAt = Date.now();
    if (DEV) console.log("[popup] refreshStatus:start");
    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
      // Keep existing accounts visible while status refreshes.
      accountsError: undefined,
    }));
    try {
      if (DEV) console.log("[popup] getStatus:calling");
      const status = await getStatus();
      if (DEV) {
        console.log("[popup] getStatus:ok", {
          unlocked: status.unlocked,
          passwordSet: status.passwordSet,
          viewMode: status.viewMode,
          ms: Date.now() - startedAt,
        });
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        status,
      }));

      // Load accounts separately so slow operations don't keep the entire popup
      // on the global loading screen.
      if (!status.unlocked) {
        setState((prev) => ({
          ...prev,
          accounts: undefined,
          accountsLoading: false,
          accountsError: undefined,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        accountsLoading: true,
        accountsError: undefined,
      }));

      const accountsStartedAt = Date.now();
      if (DEV) console.log("[popup] getAccounts:calling");
      getAccounts()
        .then((accounts) => {
          if (DEV) {
            console.log("[popup] getAccounts:ok", {
              count: accounts.length,
              ms: Date.now() - accountsStartedAt,
            });
          }
          setState((prev) => ({
            ...prev,
            accounts,
            accountsLoading: false,
            accountsError: undefined,
          }));
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          if (DEV) {
            console.log("[popup] getAccounts:fail", {
              message,
              ms: Date.now() - accountsStartedAt,
            });
          }
          setState((prev) => ({
            ...prev,
            accounts: prev.accounts ?? undefined,
            accountsLoading: false,
            accountsError: message,
          }));
        });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (DEV) {
        console.log("[popup] refreshStatus:fail", {
          message,
          ms: Date.now() - startedAt,
        });
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        accountsLoading: false,
      }));
    }
  };

  // Defensive: if we lock or have no accounts, route must be home.
  useEffect(() => {
    const unlocked = state.status?.unlocked ?? false;
    const hasAccounts = (state.accounts?.length ?? 0) > 0;
    if (!unlocked || !hasAccounts) {
      setState((prev) =>
        prev.route === "home" ? prev : { ...prev, route: "home" }
      );
    }
  }, [state.status?.unlocked, state.accounts?.length]);

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep session alive while the popup is actively used.
  useEffect(() => {
    const onPointer = () => maybeTouch();
    const onKey = () => maybeTouch();
    const onFocus = () => maybeTouch();

    const target = globalThis as unknown as {
      addEventListener?: typeof globalThis.addEventListener;
      removeEventListener?: typeof globalThis.removeEventListener;
    };

    if (!target.addEventListener || !target.removeEventListener) return;

    target.addEventListener("pointerdown", onPointer, true);
    target.addEventListener("keydown", onKey, true);
    target.addEventListener("focusin", onFocus, true);

    return () => {
      target.removeEventListener?.("pointerdown", onPointer, true);
      target.removeEventListener?.("keydown", onKey, true);
      target.removeEventListener?.("focusin", onFocus, true);
    };
  }, [state.status?.unlocked]);

  const value = useMemo<PopupContextValue>(
    () => ({
      state,
      actions: { refreshStatus, goHome, goImport, goSettings, goPrivateAddChannel },
    }),
    [state]
  );

  return (
    <PopupContext.Provider value={value}>
      {props.children}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within PopupProvider");
  return ctx;
}
