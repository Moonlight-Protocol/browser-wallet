import { PopupProvider, usePopup } from "@/popup/hooks/state.tsx";
import { LoadingPage } from "@/popup/pages/loading-page.tsx";
import { SetupWalletPage } from "@/popup/pages/setup-wallet-page.tsx";
import { UnlockWalletPage } from "@/popup/pages/unlock-wallet-page.tsx";
import { HomePage } from "@/popup/pages/home-page.tsx";
import { AddWalletPage } from "@/popup/pages/add-wallet-page.tsx";
import { ImportPage } from "@/popup/pages/import-page.tsx";
import { SettingsPage } from "@/popup/pages/settings-page.tsx";
import { PrivateAddChannelPage } from "@/popup/pages/private-add-channel-page.tsx";
import { SignRequestPage } from "@/popup/pages/sign-request-page.tsx";
import { DepositPage } from "@/popup/pages/deposit-page.tsx";
import { DepositReviewPage } from "@/popup/pages/deposit-review-page.tsx";

function AppRouter() {
  const { state } = usePopup();

  if (state.loading) return <LoadingPage />;
  if (state.error) return <LoadingPage error={state.error} />;

  if (state.route === "sign-request") {
    return <SignRequestPage />;
  }

  if (!state.status?.passwordSet) {
    return <SetupWalletPage />;
  }

  const unlocked = state.status?.unlocked ?? false;
  if (!unlocked) {
    return <UnlockWalletPage />;
  }

  if (state.accountsLoading) {
    return <LoadingPage />;
  }

  const accounts = state.accounts ?? [];

  if (unlocked && state.accounts && accounts.length === 0) {
    return <AddWalletPage />;
  }

  if (state.route === "settings") {
    return <SettingsPage />;
  }

  if (state.route === "import") {
    return <ImportPage />;
  }

  if (state.route === "private-add-channel") {
    return <PrivateAddChannelPage />;
  }

  if (state.route === "deposit") {
    return <DepositPage />;
  }

  if (state.route === "deposit-review") {
    return <DepositReviewPage />;
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
