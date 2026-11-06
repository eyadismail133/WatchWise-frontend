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
