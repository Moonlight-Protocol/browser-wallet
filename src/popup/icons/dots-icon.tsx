import type { IconProps } from "@/popup/icons/types.ts";

export function DotsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}
