import type { IconProps } from "@/popup/icons/types.ts";

export function DebugIcon(props: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Bug body */}
      <rect x="6" y="7" width="12" height="17" rx="6" />
      {/* Head */}
      <path d="M12 7V3" />
      {/* Antennae */}
      <path d="M8 1L12 4L16 1" />
      {/* Left legs */}
      <path d="M6 11H2" />
      <path d="M6 15H2" />
      <path d="M6 19H3" />
      {/* Right legs */}
      <path d="M18 11H22" />
      <path d="M18 15H22" />
      <path d="M18 19H21" />
    </svg>
  );
}
