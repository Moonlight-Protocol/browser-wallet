import type { IconProps } from "@/popup/icons/types.ts";

export function GlobeIcon(props: IconProps) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.5 3 14.5 0 18" />
      <path d="M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  );
}
