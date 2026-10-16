// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import TitleDetail from "./TitleDetail";

const detailsQueryMock = vi.fn(
  (...args: unknown[]): { data: unknown; isLoading: boolean } => {
    void args;
    return { data: undefined, isLoading: false };
  },
);
const similarQueryMock = vi.fn((...args: unknown[]) => {
  void args;
  return { data: { results: [] } };
});
const watchlistQueryMock = vi.fn((...args: unknown[]) => {
  void args;
  return { data: null };
});
const favoriteQueryMock = vi.fn((...args: unknown[]) => {
  void args;
  return { data: { isFavorite: false } };
});
const addWatchlistMock = vi.fn();
const updateWatchlistMock = vi.fn();
const addFavoriteMock = vi.fn();
const removeFavoriteMock = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
  })),
}));

vi.mock("../providers/trpcClient", () => ({
  trpc: {
    movie: {
      details: {
        useQuery: (input?: unknown, opts?: unknown) =>
          detailsQueryMock(input, opts),
      },
      similar: {
        useQuery: (input?: unknown, opts?: unknown) =>
          similarQueryMock(input, opts),
      },
    },
    watchlist: {
      getByTitle: {
        useQuery: (input?: unknown, opts?: unknown) =>
          watchlistQueryMock(input, opts),
      },
      add: {
        useMutation: () => ({ mutate: addWatchlistMock }),
      },
      update: {
        useMutation: () => ({ mutate: updateWatchlistMock }),
      },
      list: {
        invalidate: vi.fn(),
      },
    },
    favorite: {
      isFavorite: {
        useQuery: (input?: unknown, opts?: unknown) =>
          favoriteQueryMock(input, opts),
      },
      add: {
        useMutation: () => ({ mutate: addFavoriteMock }),
      },
      remove: {
        useMutation: () => ({ mutate: removeFavoriteMock }),
      },
    },
    useUtils: () => ({
      watchlist: {
        getByTitle: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
      favorite: {
        isFavorite: { invalidate: vi.fn() },
      },
    }),
  },
}));

vi.mock("../components/CommentsSection", () => ({
  CommentsSection: () => <div data-testid="comments-section" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockTitle(overrides: Record<string, unknown> = {}) {
  return {
    id: 101,
    title: "Inception",
    type: "movie" as const,
    description:
      "A thief who steals corporate secrets through dream-sharing technology.",
    genres: ["Sci-Fi", "Action"],
    moods: [],
    rating: 8.8,
    popularity_score: 85,
    hidden_gem_score: 10,
    poster_path: "https://image.tmdb.org/t/p/w500/poster.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    releaseDate: "2010-07-16",
    releaseYear: 2010,
    mediaType: "movie" as const,
    runtime: 148,
    language: "en",
    country: "US",
    castCards: [],
    directorCard: null,
    director: "Christopher Nolan",
    trailerKey: "YoHD9XEInc0",
    status: "Released",
    ...overrides,
  };
}

describe("TitleDetail artwork and presentation regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("integrates backdrop behind title and metadata in cohesive cinematic hero", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/movie/101"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const hero = screen.getByTestId("detail-hero");
    expect(hero).not.toBeNull();

    const heroImage = screen.getByTestId(
      "detail-hero-image",
    ) as HTMLImageElement;
    expect(heroImage.src).toBe(
      "https://image.tmdb.org/t/p/original/backdrop.jpg",
    );
    expect(screen.queryByTestId("detail-hero-fallback")).toBeNull();

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Inception",
    });
    expect(hero.contains(heading)).toBe(true);
    const watchlistBtn = screen.getByRole("button", {
      name: /add to watchlist/i,
    });
    expect(hero.contains(watchlistBtn)).toBe(true);
    const backLink = screen.getByRole("link", { name: /back/i });
    expect(hero.contains(backLink)).toBe(true);
  });

  it("falls back to poster in hero when backdrop fails to load", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/movie/101"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const heroImage = screen.getByTestId(
      "detail-hero-image",
    ) as HTMLImageElement;
    expect(heroImage.src).toBe(
      "https://image.tmdb.org/t/p/original/backdrop.jpg",
    );

    fireEvent.error(heroImage);

    const posterImage = screen.getByTestId(
      "detail-hero-image",
    ) as HTMLImageElement;
    expect(posterImage.src).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
    expect(screen.queryByTestId("detail-hero-fallback")).toBeNull();
  });

  it("displays graceful hero fallback background when poster also fails", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/movie/101"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.error(screen.getByTestId("detail-hero-image"));
    fireEvent.error(screen.getByTestId("detail-hero-image"));

    expect(screen.queryByTestId("detail-hero-image")).toBeNull();
    const fallback = screen.getByTestId("detail-hero-fallback");
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toContain("No Artwork Available");

    const hero = screen.getByTestId("detail-hero");
    expect(
      hero.contains(
        screen.getByRole("heading", { level: 1, name: "Inception" }),
      ),
    ).toBe(true);
  });

  it("renders graceful hero fallback immediately when title has neither backdrop nor poster", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle({
        title: "Artless Mystery",
        backdrop_path: null,
        poster_path: null,
      }),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/movie/102"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("detail-hero-image")).toBeNull();
    const fallback = screen.getByTestId("detail-hero-fallback");
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toContain("No Artwork Available");

    const hero = screen.getByTestId("detail-hero");
    expect(
      hero.contains(
        screen.getByRole("heading", { level: 1, name: "Artless Mystery" }),
      ),
    ).toBe(true);
    expect(hero.contains(screen.getByRole("link", { name: /back/i }))).toBe(
      true,
    );
  });

  it("preserves TV mediaType and displays TV metadata and episode details", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle({
        id: 201,
        title: "Severance",
        type: "series",
        mediaType: "tv",
        numberOfSeasons: 2,
        numberOfEpisodes: 19,
      }),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/tv/201"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Severance" }),
    ).not.toBeNull();
    expect(screen.getByText("Seasons")).not.toBeNull();
    expect(screen.getByText("2")).not.toBeNull();
    expect(screen.getByText("Episodes")).not.toBeNull();
    expect(screen.getByText("19")).not.toBeNull();
  });
});
