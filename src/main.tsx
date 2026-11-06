import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { MotionConfig } from "motion/react";
import "./index.css";
import { TRPCProvider } from "./providers/trpc";
import App from "./App.tsx";
import { Toaster } from "./components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        {/* Respect OS "reduce motion": transforms/layout animations switch off app-wide. */}
        <MotionConfig reducedMotion="user">
          <App />
          <Toaster />
        </MotionConfig>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Fade out the boot splash once the app has painted and the brand fonts are
// ready (capped so a slow font never blocks the page).
const boot = document.getElementById("boot");
if (boot) {
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() =>
    requestAnimationFrame(() => {
      boot.classList.add("hide");
      setTimeout(() => boot.remove(), 400);
    }),
  );
}

