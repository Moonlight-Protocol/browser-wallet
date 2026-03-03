import "@/common/polyfills/node-globals.ts";
import browser from "webextension-polyfill";
import {
  type Handler,
  HandlerMap,
  type Message,
  type MessageFor,
  MessageType,
  type Response,
} from "@/background/messages.ts";
import { handleGetAccounts } from "@/background/handlers/accounts/get-accounts.ts";
import { handleGetStatus } from "@/background/handlers/session/get-status.ts";
import { handleUnlock } from "@/background/handlers/session/unlock.ts";
import { handleLock } from "@/background/handlers/session/lock.ts";
import { handleCreateWallet } from "@/background/handlers/wallet/create-wallet.ts";
import { handleImportWallet } from "@/background/handlers/wallet/import-wallet.ts";
import { handleImportSecret } from "@/background/handlers/accounts/import-secret.ts";
import { handleDeriveAccount } from "@/background/handlers/accounts/derive-account.ts";
import { handleTouch } from "@/background/handlers/session/touch.ts";
import { handleSetNetwork } from "@/background/handlers/session/set-network.ts";
import { handleSetViewMode } from "@/background/handlers/session/set-view-mode.ts";
import { handleSetSelectedAccount } from "@/background/handlers/accounts/set-selected-account.ts";
import { handleRenameAccount } from "@/background/handlers/accounts/rename-account.ts";
import { handleGetChainState } from "@/background/handlers/chain/get-chain-state.ts";
import { handleSyncChainState } from "@/background/handlers/chain/sync-chain-state.ts";
import { handleGetAccountActivationStatus } from "@/background/handlers/chain/get-account-activation-status.ts";
import { handleFundWithFriendbot } from "@/background/handlers/chain/fund-with-friendbot.ts";
import { handleGetPrivateChannels } from "@/background/handlers/private/get-private-channels.ts";
import { handleAddPrivateChannel } from "@/background/handlers/private/add-private-channel.ts";
import { handleSetSelectedPrivateChannel } from "@/background/handlers/private/set-selected-private-channel.ts";
import { handleEnsurePrivateChannelTracking } from "@/background/handlers/private/ensure-private-channel-tracking.ts";
import { handleGetPrivateStats } from "@/background/handlers/private/get-private-stats.ts";
import { handleAddPrivacyProvider } from "@/background/handlers/private/add-privacy-provider.ts";
import { handleRemovePrivacyProvider } from "@/background/handlers/private/remove-privacy-provider.ts";
import { handleSetSelectedPrivacyProvider } from "@/background/handlers/private/set-selected-privacy-provider.ts";
import { handleConnectPrivacyProvider } from "@/background/handlers/private/connect-privacy-provider.ts";
import { handleDisconnectPrivacyProvider } from "@/background/handlers/private/disconnect-privacy-provider.ts";
import { handleGetPrivacyProviderAuthChallenge } from "@/background/handlers/private/get-privacy-provider-auth-challenge.ts";
import { handleRequestSigning } from "@/background/handlers/signing/request-signing.ts";
import { handleGetSigningRequest } from "@/background/handlers/signing/get-signing-request.ts";
import { handleApproveSigningRequest } from "@/background/handlers/signing/approve-signing-request.ts";
import { handleRejectSigningRequest } from "@/background/handlers/signing/reject-signing-request.ts";
import { handleDeposit } from "@/background/handlers/private/deposit.ts";
import { ensureSessionHydrated } from "@/background/session.ts";

// Background service worker
console.log("Stellar Wallet Background Script Initialized");

const handlers: HandlerMap = {
  [MessageType.GetAccounts]: handleGetAccounts,
  [MessageType.GetStatus]: handleGetStatus,
  [MessageType.GetChainState]: handleGetChainState,
  [MessageType.SyncChainState]: handleSyncChainState,
  [MessageType.GetAccountActivationStatus]: handleGetAccountActivationStatus,
  [MessageType.FundWithFriendbot]: handleFundWithFriendbot,
  [MessageType.Unlock]: handleUnlock,
  [MessageType.Lock]: handleLock,
  [MessageType.CreateWallet]: handleCreateWallet,
  [MessageType.ImportWallet]: handleImportWallet,
  [MessageType.ImportSecret]: handleImportSecret,
  [MessageType.DeriveAccount]: handleDeriveAccount,
  [MessageType.RenameAccount]: handleRenameAccount,
  [MessageType.Touch]: handleTouch,
  [MessageType.SetNetwork]: handleSetNetwork,
  [MessageType.SetViewMode]: handleSetViewMode,
  [MessageType.SetSelectedAccount]: handleSetSelectedAccount,
  [MessageType.GetPrivateChannels]: handleGetPrivateChannels,
  [MessageType.AddPrivateChannel]: handleAddPrivateChannel,
  [MessageType.SetSelectedPrivateChannel]: handleSetSelectedPrivateChannel,
  [MessageType.EnsurePrivateChannelTracking]:
    handleEnsurePrivateChannelTracking,
  [MessageType.GetPrivateStats]: handleGetPrivateStats,
  [MessageType.AddPrivacyProvider]: handleAddPrivacyProvider,
  [MessageType.RemovePrivacyProvider]: handleRemovePrivacyProvider,
  [MessageType.SetSelectedPrivacyProvider]: handleSetSelectedPrivacyProvider,
  [MessageType.ConnectPrivacyProvider]: handleConnectPrivacyProvider,
  [MessageType.DisconnectPrivacyProvider]: handleDisconnectPrivacyProvider,
  [MessageType.GetPrivacyProviderAuthChallenge]:
    handleGetPrivacyProviderAuthChallenge,
  [MessageType.RequestSigning]: handleRequestSigning,
  [MessageType.GetSigningRequest]: handleGetSigningRequest,
  [MessageType.ApproveSigningRequest]: handleApproveSigningRequest,
  [MessageType.RejectSigningRequest]: handleRejectSigningRequest,
  [MessageType.Deposit]: handleDeposit,
};

browser.runtime.onMessage.addListener(
  async (message: Message): Promise<Response> => {
    const startedAt = Date.now();
    // Fast path: GET_STATUS is designed to be resilient even before hydration.
    if (message.type !== MessageType.GetStatus) {
      try {
        await ensureSessionHydrated();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Background message hydration failed", {
          type: message?.type,
          message: msg,
          ms: Date.now() - startedAt,
        });
        throw err;
      }
    }

    const handler = handlers[message.type] as
      | Handler<typeof message.type>
      | undefined;

    if (!handler) {
      throw new Error(`Unhandled message type: ${String(message.type)}`);
    }

    try {
      const res = await handler(message as MessageFor<typeof message.type>);
      console.log("Background message handled", {
        type: message?.type,
        ms: Date.now() - startedAt,
      });
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Background handler failed", {
        type: message?.type,
        message: msg,
        ms: Date.now() - startedAt,
      });
      throw err;
    }
  },
);
