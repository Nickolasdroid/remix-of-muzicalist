import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Import i18n after React
import "./i18n";

// iOS Safari ignores `user-scalable=no` in the viewport meta, so pinch-to-zoom
// on the page is blocked here via the iOS-only `gesture*` events. These events
// fire only for multi-touch pinch/rotate on Safari — scrolling, taps, swipes,
// drags and all single-touch interactions are untouched.
["gesturestart", "gesturechange", "gestureend"].forEach((evt) => {
  document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
});


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
