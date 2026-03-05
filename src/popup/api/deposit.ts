import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  DepositRequest,
  DepositResponse,
  PrepareDepositRequest,
  PrepareDepositResponse,
} from "@/background/handlers/private/deposit.types.ts";

export const prepareDeposit = async (
  params: PrepareDepositRequest,
): Promise<PrepareDepositResponse> => {
  return await callBackground<MessageType.PrepareDeposit>({
    type: MessageType.PrepareDeposit,
    ...params,
  });
};

export const deposit = async (
  params: DepositRequest,
): Promise<DepositResponse> => {
  return await callBackground<MessageType.Deposit>({
    type: MessageType.Deposit,
    ...params,
  });
};
