// Global jsdom shims for animation/scroll APIs used by Motion's whileInView,
// useInView and the ScrollRow resize tracking. Tests assert content, not frames.
class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== "undefined") {
  if (!("IntersectionObserver" in window)) {
    Object.defineProperty(window, "IntersectionObserver", { writable: true, configurable: true, value: MockIntersectionObserver });
    Object.defineProperty(globalThis, "IntersectionObserver", { writable: true, configurable: true, value: MockIntersectionObserver });
  }
  if (!("ResizeObserver" in window)) {
    Object.defineProperty(window, "ResizeObserver", { writable: true, configurable: true, value: MockResizeObserver });
    Object.defineProperty(globalThis, "ResizeObserver", { writable: true, configurable: true, value: MockResizeObserver });
  }
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}
