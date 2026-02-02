import { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type SigningRequestType = "transaction" | "auth-challenge";

export interface BaseSigningRequest {
  id: string;
  accountId: string;
  network: ChainNetwork;
  createdAt: number;
}

export interface TransactionSigningRequest extends BaseSigningRequest {
  type: "transaction" | "auth-challenge";
  xdr: string;
}

export type SigningRequest = TransactionSigningRequest;

export class SigningRequestManager {
  private requests: Map<string, SigningRequest> = new Map();
  private pendingResolvers: Map<
    string,
    { resolve: (value: string) => void; reject: (reason?: unknown) => void }
  > = new Map();

  createRequest(
    params: Omit<TransactionSigningRequest, "id" | "createdAt">,
  ): SigningRequest {
    const id = crypto.randomUUID();
    const request: SigningRequest = {
      ...params,
      id,
      createdAt: Date.now(),
    };
    this.requests.set(id, request);
    return request;
  }

  getRequest(id: string): SigningRequest | undefined {
    return this.requests.get(id);
  }

  removeRequest(id: string): void {
    this.requests.delete(id);
    const pending = this.pendingResolvers.get(id);
    if (pending) {
      pending.reject(new Error("Request removed"));
      this.pendingResolvers.delete(id);
    }
  }

  getAllRequests(): SigningRequest[] {
    return Array.from(this.requests.values());
  }

  waitForResult(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.pendingResolvers.set(id, { resolve, reject });
    });
  }

  resolveRequest(id: string, signedXdr: string): void {
    const pending = this.pendingResolvers.get(id);
    if (pending) {
      pending.resolve(signedXdr);
      this.pendingResolvers.delete(id);
      this.requests.delete(id);
    }
  }

  rejectRequest(id: string, error: Error): void {
    const pending = this.pendingResolvers.get(id);
    if (pending) {
      pending.reject(error);
      this.pendingResolvers.delete(id);
      this.requests.delete(id);
    }
  }
}
