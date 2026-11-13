import "./lib/recoveryCapture";
import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Import i18n after React
import "./i18n";
import { startActivityTracking } from "@/lib/activityTracker";
import { watchPasswordRecovery } from "@/lib/passwordRecovery";

import { polyfillFlagEmoji } from "@/lib/flagEmojiPolyfill";

startActivityTracking();
watchPasswordRecovery();
polyfillFlagEmoji();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
