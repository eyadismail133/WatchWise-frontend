import { createAuthClient } from "better-auth/react";

/** Same-origin /api via Vite proxy so session cookies stay on the app origin */
export const authClient = createAuthClient({
  baseURL: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});
