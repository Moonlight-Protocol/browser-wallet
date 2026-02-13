import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStatus, type PopupStatus } from "@/popup/api/get-status.ts";
import { getAccounts } from "@/popup/api/get-accounts.ts";
import { touch } from "@/popup/api/touch.ts";
import { DEV } from "@/common/dev-flag.ts";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";

export type PopupRoute =
  | "home"
  | "import"
  | "settings"
  | "private-add-channel"
  | "sign-request"
  | "deposit"
  | "deposit-review";

type PopupState = {
  loading: boolean;
  error?: string;
  status?: PopupStatus;
  accounts?: SafeAccount[];
  accountsLoading: boolean;
  accountsError?: string;
  route: PopupRoute;
  signingRequestId?: string;
  /** True if signing was initiated from within popup (navigate back after) */
  inPopupSigningFlow: boolean;
  /** Incremented to trigger private channels refresh */
  privateChannelsRefreshKey: number;
  /** Temporary deposit form data */
  depositFormData?: {
    channelId: string;
    providerId: string;
    method: "DIRECT" | "3RD-PARTY RAMP";
    amount: string;
    entropyLevel: "LOW" | "MEDIUM" | "HIGH" | "V_HIGH";
  };
};

type PopupActions = {
  refreshStatus: () => Promise<void>;
  goHome: () => void;
  goImport: () => void;
  goSettings: () => void;
  goPrivateAddChannel: () => void;
  goSignRequest: (requestId: string) => void;
  goDeposit: (channelId?: string, providerId?: string) => void;
  goDepositReview: () => void;
  setDepositFormData: (data: PopupState["depositFormData"]) => void;
  clearDepositFormData: () => void;
};

type PopupContextValue = {
  state: PopupState;
  actions: PopupActions;
};

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export function PopupProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<PopupState>(() => {
    const hash = globalThis.location.hash;
    let route: PopupRoute = "home";
    let signingRequestId: string | undefined;

    if (hash.startsWith("#/sign-request/")) {
      route = "sign-request";
      signingRequestId = hash.replace("#/sign-request/", "");
    }

    return {
      loading: true,
      accountsLoading: false,
      route,
      signingRequestId,
      inPopupSigningFlow: false,
      privateChannelsRefreshKey: 0,
      depositFormData: undefined,
    };
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

  const goHome = () =>
    setState((prev) => ({
      ...prev,
      route: "home",
      inPopupSigningFlow: false,
      // Increment refresh key if coming back from signing flow to trigger reload
      privateChannelsRefreshKey: prev.inPopupSigningFlow
        ? prev.privateChannelsRefreshKey + 1
        : prev.privateChannelsRefreshKey,
    }));
  const goImport = () => setState((prev) => ({ ...prev, route: "import" }));
  const goSettings = () => setState((prev) => ({ ...prev, route: "settings" }));
  const goPrivateAddChannel = () =>
    setState((prev) => ({ ...prev, route: "private-add-channel" }));
  const goSignRequest = (requestId: string) =>
    setState((prev) => ({
      ...prev,
      route: "sign-request",
      signingRequestId: requestId,
      inPopupSigningFlow: true,
    }));
  const goDeposit = (channelId?: string, providerId?: string) =>
    setState((prev) => ({
      ...prev,
      route: "deposit",
      depositFormData: channelId && providerId
        ? {
          channelId,
          providerId,
          method: "DIRECT",
          amount: "",
          entropyLevel: "MEDIUM",
        }
        : prev.depositFormData,
    }));
  const goDepositReview = () =>
    setState((prev) => {
      if (!prev.depositFormData) {
        console.warn("Cannot navigate to deposit review without form data");
        return prev;
      }
      return { ...prev, route: "deposit-review" };
    });
  const setDepositFormData = (data: PopupState["depositFormData"]) =>
    setState((prev) => ({ ...prev, depositFormData: data }));
  const clearDepositFormData = () =>
    setState((prev) => ({ ...prev, depositFormData: undefined }));

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
    // If we are in a special flow like signing, do not force-reset to home.
    if (state.route === "sign-request") return;

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
      actions: {
        refreshStatus,
        goHome,
        goImport,
        goSettings,
        goPrivateAddChannel,
        goSignRequest,
        goDeposit,
        goDepositReview,
        setDepositFormData,
        clearDepositFormData,
      },
    }),
    [state],
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
