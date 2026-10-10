import { createAuthClient } from "better-auth/react";
import { apiUrl } from "./api-url";

/** Same-origin /api via Vite proxy so session cookies stay on the app origin */
export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: {
    credentials: "include",
  },
});
