import type {
  GetAccountsRequest,
  GetAccountsResponse,
} from "@/background/handlers/get-accounts.types.ts";
import type {
  UnlockRequest,
  UnlockResponse,
} from "@/background/handlers/unlock.types.ts";
import type {
  LockRequest,
  LockResponse,
} from "@/background/handlers/lock.types.ts";
import type {
  GetStatusRequest,
  GetStatusResponse,
} from "@/background/handlers/get-status.types.ts";
import type {
  CreateWalletRequest,
  CreateWalletResponse,
} from "@/background/handlers/create-wallet.types.ts";
import type {
  ImportWalletRequest,
  ImportWalletResponse,
} from "@/background/handlers/import-wallet.types.ts";
import type {
  TouchRequest,
  TouchResponse,
} from "@/background/handlers/touch.types.ts";
import type {
  SetNetworkRequest,
  SetNetworkResponse,
} from "@/background/handlers/set-network.types.ts";
import type {
  SetSelectedAccountRequest,
  SetSelectedAccountResponse,
} from "@/background/handlers/set-selected-account.types.ts";
import type {
  DeriveAccountRequest,
  DeriveAccountResponse,
} from "@/background/handlers/derive-account.types.ts";
import type {
  ImportSecretRequest,
  ImportSecretResponse,
} from "@/background/handlers/import-secret.types.ts";
import type {
  RenameAccountRequest,
  RenameAccountResponse,
} from "@/background/handlers/rename-account.types.ts";

// Helper types and mapped types for messages and responses
// ==============================================================================
export type MessageFor<T extends MessageType> = {
  type: T;
} & MessagePayloadMap[T];

export type ResponseFor<T extends MessageType> = {
  type: T;
} & ResponsePayloadMap[T];

export type Message = MessageFor<MessageType>;
export type Response = ResponseFor<MessageType>;

export type Handler<K extends MessageType> = (
  message: MessageFor<K>
) => ResponseFor<K> | Promise<ResponseFor<K>>;

export type HandlerMap = {
  [K in MessageType]: Handler<K>;
};

// Message Types
// ==============================================================================

export enum MessageType {
  GetAccounts = "GET_ACCOUNTS",
  GetStatus = "GET_STATUS",
  Unlock = "UNLOCK",
  Lock = "LOCK",
  CreateWallet = "CREATE_WALLET",
  ImportWallet = "IMPORT_WALLET",
  ImportSecret = "IMPORT_SECRET",
  DeriveAccount = "DERIVE_ACCOUNT",
  RenameAccount = "RENAME_ACCOUNT",
  Touch = "TOUCH",
  SetNetwork = "SET_NETWORK",
  SetSelectedAccount = "SET_SELECTED_ACCOUNT",
}

export type MessagePayloadMap = {
  [MessageType.GetAccounts]: GetAccountsRequest;
  [MessageType.GetStatus]: GetStatusRequest;
  [MessageType.Unlock]: UnlockRequest;
  [MessageType.Lock]: LockRequest;
  [MessageType.CreateWallet]: CreateWalletRequest;
  [MessageType.ImportWallet]: ImportWalletRequest;
  [MessageType.ImportSecret]: ImportSecretRequest;
  [MessageType.DeriveAccount]: DeriveAccountRequest;
  [MessageType.RenameAccount]: RenameAccountRequest;
  [MessageType.Touch]: TouchRequest;
  [MessageType.SetNetwork]: SetNetworkRequest;
  [MessageType.SetSelectedAccount]: SetSelectedAccountRequest;
};

export type ResponsePayloadMap = {
  [MessageType.GetAccounts]: GetAccountsResponse;
  [MessageType.GetStatus]: GetStatusResponse;
  [MessageType.Unlock]: UnlockResponse;
  [MessageType.Lock]: LockResponse;
  [MessageType.CreateWallet]: CreateWalletResponse;
  [MessageType.ImportWallet]: ImportWalletResponse;
  [MessageType.ImportSecret]: ImportSecretResponse;
  [MessageType.DeriveAccount]: DeriveAccountResponse;
  [MessageType.RenameAccount]: RenameAccountResponse;
  [MessageType.Touch]: TouchResponse;
  [MessageType.SetNetwork]: SetNetworkResponse;
  [MessageType.SetSelectedAccount]: SetSelectedAccountResponse;
};
