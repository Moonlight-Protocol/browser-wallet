import { Shell } from "@/popup/templates/shell.tsx";

export function LoadingPage() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold text-slate-800">Stellar Wallet</h1>
      <p className="mt-4 text-slate-600">Loading…</p>
    </Shell>
  );
}
