import { createAuthClient } from "better-auth/react";

/** Same-origin /api via Vite proxy so session cookies stay on the app origin */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  fetchOptions: {
    credentials: "include",
  },
});
