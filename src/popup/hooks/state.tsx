import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getStatus, type PopupStatus } from "@/popup/api/get-status.ts";
import { getAccounts } from "@/popup/api/get-accounts.ts";
import type { SafeAccount } from "@/background/handlers/get-accounts.types.ts";

export type PopupRoute = "home" | "import";

type PopupState = {
  loading: boolean;
  error?: string;
  status?: PopupStatus;
  accounts?: SafeAccount[];
  route: PopupRoute;
};

type PopupActions = {
  refreshStatus: () => Promise<void>;
  goHome: () => void;
  goImport: () => void;
};

type PopupContextValue = {
  state: PopupState;
  actions: PopupActions;
};

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export function PopupProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<PopupState>({
    loading: true,
    route: "home",
  });

  const goHome = () => setState((prev) => ({ ...prev, route: "home" }));
  const goImport = () => setState((prev) => ({ ...prev, route: "import" }));

  const refreshStatus = async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const status = await getStatus();

      const accounts = status.unlocked ? await getAccounts() : undefined;

      console.log("Popup status refreshed:", { status, accounts });

      setState((prev) => ({
        ...prev,
        loading: false,
        status,
        accounts,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
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

  const value = useMemo<PopupContextValue>(
    () => ({ state, actions: { refreshStatus, goHome, goImport } }),
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
