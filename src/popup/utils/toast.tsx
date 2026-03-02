import { toast, Toaster, type ToastOptions } from "react-hot-toast";

// Central place to configure default options for all toasts
const defaultOptions: ToastOptions = {
  duration: 4000,
};

export function ToastHost() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        ...defaultOptions,
        style: {
          background: "oklch(0.18 0.03 265)",
          color: "white",
          // Match global card radius: Tailwind's rounded-xl (~0.75rem)
          borderRadius: "0.75rem",
          paddingInline: "16px",
          paddingBlock: "10px",
          fontSize: "12px",
          border: "1px solid oklch(0.7 0.05 250 / 0.4)",
        },
        success: {
          iconTheme: {
            primary: "oklch(0.75 0.16 145)",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "oklch(0.7 0.18 25)",
            secondary: "white",
          },
        },
      }}
    />
  );
}

export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, { ...defaultOptions, ...options });
}

export function showError(message: string, options?: ToastOptions) {
  toast.error(message, { ...defaultOptions, ...options });
}

export function showInfo(message: string, options?: ToastOptions) {
  toast(message, { ...defaultOptions, ...options });
}

export function showAsyncSubmitted(
  operation: "deposit" | "receive" | "send" | "withdraw" | "connect-provider",
) {
  const labels: Record<typeof operation, string> = {
    "deposit": "Deposit",
    "receive": "Receive",
    "send": "Send",
    "withdraw": "Withdraw",
    "connect-provider": "Provider connection",
  };

  const label = labels[operation];

  showInfo(
    `${label} request submitted. It will be processed asynchronously by the Privacy Provider Platform.`,
  );
}
