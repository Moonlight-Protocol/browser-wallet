/** @type {import('npm:tailwindcss').Config} */
export default {
  content: ["./src/popup/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--popup-bg)",
        primary: "var(--popup-text-primary)",
        muted: "var(--popup-text-muted)",
        error: "var(--popup-text-error)",
      },
    },
  },
  plugins: [],
};
