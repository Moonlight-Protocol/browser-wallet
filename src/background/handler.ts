import browser from "webextension-polyfill";
import {
  MessageType,
  type Message,
  type MessageFor,
  type Response,
  type Handler,
  HandlerMap,
} from "@/background/messages.ts";
import { handleGetAccounts } from "@/background/handlers/get-accounts.ts";
import { handleGetStatus } from "@/background/handlers/get-status.ts";
import { handleUnlock } from "@/background/handlers/unlock.ts";
import { handleLock } from "@/background/handlers/lock.ts";
import { handleCreateWallet } from "@/background/handlers/create-wallet.ts";
import { handleImportWallet } from "@/background/handlers/import-wallet.ts";
import { handleImportSecret } from "@/background/handlers/import-secret.ts";
import { handleDeriveAccount } from "@/background/handlers/derive-account.ts";
import { handleTouch } from "@/background/handlers/touch.ts";
import { handleSetNetwork } from "@/background/handlers/set-network.ts";
import { handleSetSelectedAccount } from "@/background/handlers/set-selected-account.ts";
import { handleRenameAccount } from "@/background/handlers/rename-account.ts";

// Background service worker
console.log("Stellar Wallet Background Script Initialized");

const handlers: HandlerMap = {
  [MessageType.GetAccounts]: handleGetAccounts,
  [MessageType.GetStatus]: handleGetStatus,
  [MessageType.Unlock]: handleUnlock,
  [MessageType.Lock]: handleLock,
  [MessageType.CreateWallet]: handleCreateWallet,
  [MessageType.ImportWallet]: handleImportWallet,
  [MessageType.ImportSecret]: handleImportSecret,
  [MessageType.DeriveAccount]: handleDeriveAccount,
  [MessageType.RenameAccount]: handleRenameAccount,
  [MessageType.Touch]: handleTouch,
  [MessageType.SetNetwork]: handleSetNetwork,
  [MessageType.SetSelectedAccount]: handleSetSelectedAccount,
};

browser.runtime.onMessage.addListener(
  async (message: Message): Promise<Response> => {
    const handler = handlers[message.type] as
      | Handler<typeof message.type>
      | undefined;

    if (!handler) {
      throw new Error(`Unhandled message type: ${String(message.type)}`);
    }

    return await handler(message as MessageFor<typeof message.type>);
  }
);
