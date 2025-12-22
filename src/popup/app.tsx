import React from "react";
import { PopupProvider, usePopup } from "@/popup/hooks/state.tsx";
import { LoadingPage } from "@/popup/pages/loading-page.tsx";
import { SetupWalletPage } from "@/popup/pages/setup-wallet-page.tsx";
import { UnlockWalletPage } from "@/popup/pages/unlock-wallet-page.tsx";
import { HomePage } from "@/popup/pages/home-page.tsx";
import { AddWalletPage } from "@/popup/pages/add-wallet-page.tsx";
import { ImportPage } from "@/popup/pages/import-page.tsx";

function AppRouter() {
  const { state } = usePopup();

  if (state.loading) return <LoadingPage />;
  if (state.error) return <LoadingPage />;

  if (!state.status?.passwordSet) {
    return <SetupWalletPage />;
  }

  const unlocked = state.status?.unlocked ?? false;
  if (!unlocked) {
    return <UnlockWalletPage />;
  }

  const accounts = state.accounts ?? [];

  if (unlocked && accounts.length === 0) {
    return <AddWalletPage />;
  }

  if (state.route === "import") {
    return <ImportPage />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <PopupProvider>
      <AppRouter />
    </PopupProvider>
  );
}
