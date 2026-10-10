import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./api-url";

describe("resolveApiUrl", () => {
  it("prefers the replacement public backend URL", () => {
    expect(
      resolveApiUrl({
        VITE_API_URL: "https://legacy.example.com",
        VITE_BACKEND_URL: "https://watch-wise-backend.vercel.app",
      }),
    ).toBe("https://watch-wise-backend.vercel.app");
  });

  it("uses the legacy URL when no replacement is configured", () => {
    expect(resolveApiUrl({ VITE_API_URL: "https://legacy.example.com" })).toBe(
      "https://legacy.example.com",
    );
  });
});
