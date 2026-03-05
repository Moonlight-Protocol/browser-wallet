import "@/common/polyfills/node-globals.ts";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import { ToastHost } from "@/popup/utils/toast.tsx";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
      <ToastHost />
    </React.StrictMode>,
  );
}
