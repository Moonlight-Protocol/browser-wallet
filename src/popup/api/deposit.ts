import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  DepositRequest,
  DepositResponse,
} from "@/background/handlers/private/deposit.types.ts";

export const deposit = async (
  params: DepositRequest,
): Promise<DepositResponse> => {
  return await callBackground<MessageType.Deposit>({
    type: MessageType.Deposit,
    ...params,
  });
};
