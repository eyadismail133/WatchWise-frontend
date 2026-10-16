// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

function TestComponent() {
  const isMobile = useIsMobile();
  return <div data-testid="status">{isMobile ? "mobile" : "desktop"}</div>;
}

describe("useIsMobile mounted behavior", () => {
  const originalInnerWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  it("mounts with initial breakpoint and rerenders on media query change, unsubscribing on unmount", () => {
    let changeHandler: (() => void) | null = null;
    const removeEventListenerMock = vi.fn();

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: removeEventListenerMock,
    }));

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { unmount } = render(<TestComponent />);
    expect(screen.getByTestId("status").textContent).toBe("desktop");

    // Change window width to mobile breakpoint and dispatch change event
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    act(() => {
      changeHandler?.();
    });

    // Observes actual rerender across breakpoint
    expect(screen.getByTestId("status").textContent).toBe("mobile");

    // Change back to desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });

    act(() => {
      changeHandler?.();
    });

    expect(screen.getByTestId("status").textContent).toBe("desktop");

    // Unmount and verify cleanup
    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith("change", changeHandler);
  });
});
