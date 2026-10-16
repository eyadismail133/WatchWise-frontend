// @vitest-environment jsdom
import { use } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "./App";

let resolveDeferredPrivacy: () => void = () => {};
let deferredPrivacyPromise: Promise<void> = Promise.resolve();

function resetDeferredPrivacy() {
  deferredPrivacyPromise = new Promise<void>((resolve) => {
    resolveDeferredPrivacy = resolve;
  });
}

resetDeferredPrivacy();

function MockPrivacyPolicy() {
  use(deferredPrivacyPromise);
  return <h1>Privacy Policy</h1>;
}

vi.mock("./pages/PrivacyPolicy", () => ({
  default: MockPrivacyPolicy,
}));

vi.mock("./hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    logout: vi.fn(),
    refetchSession: vi.fn(),
  })),
}));

vi.mock("./providers/trpcClient", () => ({
  trpc: {
    user: {
      getMyProfile: {
        useQuery: vi.fn(() => ({ data: null, isLoading: false })),
      },
      searchUsers: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false })),
      },
    },
    movie: {
      trending: {
        useQuery: vi.fn(() => ({ data: { results: [] }, isLoading: false })),
      },
      topRated: {
        useQuery: vi.fn(() => ({ data: { results: [] }, isLoading: false })),
      },
      upComing: {
        useQuery: vi.fn(() => ({ data: { results: [] }, isLoading: false })),
      },
      details: {
        useQuery: vi.fn(
          ({ id, mediaType }: { id: number; mediaType: string }) => ({
            data: {
              id,
              title: `Title #${id}`,
              type:
                mediaType === "tv" ? ("series" as const) : ("movie" as const),
              description: "Test description",
              genres: ["Drama"],
              moods: [],
              rating: 8.5,
              popularity_score: 50,
              hidden_gem_score: 5,
              poster_path: null,
              backdrop_path: null,
              releaseDate: "2024-01-01",
              releaseYear: 2024,
              mediaType: mediaType as "movie" | "tv",
              runtime: 120,
              castCards: [],
              directorCard: null,
            },
            isLoading: false,
          }),
        ),
      },
      similar: {
        useQuery: vi.fn(() => ({ data: { results: [] }, isLoading: false })),
      },
    },
    watchlist: {
      getByTitle: {
        useQuery: vi.fn(() => ({ data: null })),
      },
      list: {
        invalidate: vi.fn(),
      },
      add: {
        useMutation: vi.fn(() => ({ mutate: vi.fn() })),
      },
      update: {
        useMutation: vi.fn(() => ({ mutate: vi.fn() })),
      },
    },
    favorite: {
      isFavorite: {
        useQuery: vi.fn(() => ({ data: { isFavorite: false } })),
      },
      add: {
        useMutation: vi.fn(() => ({ mutate: vi.fn() })),
      },
      remove: {
        useMutation: vi.fn(() => ({ mutate: vi.fn() })),
      },
    },
    useUtils: vi.fn(() => ({
      watchlist: {
        getByTitle: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
      favorite: { isFavorite: { invalidate: vi.fn() } },
    })),
  },
}));

vi.mock("./components/CommentsSection", () => ({
  CommentsSection: () => <div data-testid="comments-section" />,
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe("App route lazy-loading, persistent shell, and direct route regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDeferredPrivacy();
    window.scrollTo = vi.fn();
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("mounts eager Home route immediately without rendering Suspense loading fallback", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner")).not.toBeNull();
    expect(screen.getAllByText("WatchWise").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders accessible loading status inside persistent shell for deferred routes and resolves content", async () => {
    render(
      <MemoryRouter initialEntries={["/privacy-policy"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).not.toBeNull();
    expect(screen.getByText("Loading page...")).not.toBeNull();
    expect(screen.getByRole("banner")).not.toBeNull();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeNull();

    await act(async () => {
      resolveDeferredPrivacy();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
      ).not.toBeNull();
    });

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("banner")).not.toBeNull();
  });

  it("resolves direct detail path /title/:mediaType/:id within persistent shell", async () => {
    render(
      <MemoryRouter initialEntries={["/title/movie/42"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner")).not.toBeNull();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Title #42" }),
      ).not.toBeNull();
    });

    expect(screen.getByTestId("detail-hero")).not.toBeNull();
    expect(screen.getByRole("link", { name: /back/i })).not.toBeNull();
  });

  it("resolves legacy direct detail path /title/:id within persistent shell", async () => {
    render(
      <MemoryRouter initialEntries={["/title/99"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner")).not.toBeNull();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Title #99" }),
      ).not.toBeNull();
    });

    expect(screen.getByTestId("detail-hero")).not.toBeNull();
    expect(screen.getByRole("link", { name: /back/i })).not.toBeNull();
  });
});
