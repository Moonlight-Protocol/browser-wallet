import type { IconProps } from "@/popup/icons/types.ts";

export function MasterWalletIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 7H9a2 2 0 0 0-2 2v10" />
      <path d="M16 3H7a2 2 0 0 0-2 2v14" />
      <path d="M12 12h8" />
      <path d="M16 8v8" />
    </svg>
  );
}
