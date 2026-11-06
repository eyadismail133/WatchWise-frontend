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
      episodeRatings: {
        useQuery: () => ({
          isLoading: false,
          isError: false,
          data: {
            tvId: 301,
            name: "Severance",
            average: 8.4,
            best: { seasonNumber: 1, episodeNumber: 9, name: "The We We Are", rating: 9.6, voteCount: 90, airDate: "2022-04-08", episodeType: "finale", aired: true },
            worst: { seasonNumber: 1, episodeNumber: 1, name: "Good News About Hell", rating: 8.4, voteCount: 50, airDate: "2022-02-18", episodeType: "standard", aired: true },
            seasons: [
              {
                seasonNumber: 1,
                episodes: [
                  { episodeNumber: 1, name: "Good News About Hell", airDate: "2022-02-18", rating: 8.4, voteCount: 50, episodeType: "standard", aired: true },
                  { episodeNumber: 9, name: "The We We Are", airDate: "2022-04-08", rating: 9.6, voteCount: 90, episodeType: "finale", aired: true },
                ],
              },
            ],
          },
        }),
      },
      season: {
        useQuery: () => ({
          isLoading: false,
          isError: false,
          data: {
            episodes: [
              {
                id: 1,
                name: "Good News About Hell",
                seasonNumber: 1,
                episodeNumber: 1,
                airDate: "2022-02-18",
                still: null,
                overview: "Mark is promoted.",
                runtime: 57,
                rating: 8.4,
                directors: ["Ben Stiller"],
                guestStars: [],
              },
            ],
          },
        }),
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

  it("renders rich TMDB extras: trailer player, providers, crew, collection and season guide", () => {
    detailsQueryMock.mockReturnValue({
      data: createMockTitle({
        id: 301,
        title: "Severance",
        type: "series",
        mediaType: "tv",
        imdbRating: 8.7,
        voteCount: 2400,
        certification: "TV-MA",
        castCards: [
          { id: 7, name: "Adam Scott", character: "Mark S.", image: null, profile_path: null },
        ],
        crewHighlights: [
          { id: 8, name: "Ben Stiller", image: null, profile_path: null, jobs: ["Director", "Executive Producer"], department: "Directing" },
        ],
        watchProviders: {
          region: "US",
          link: "https://www.themoviedb.org/tv/301/watch",
          stream: [{ id: 350, name: "Apple TV+", logo: null, priority: 1 }],
          rent: [],
          buy: [],
          free: [],
        },
        seasons: [
          { id: 11, seasonNumber: 1, name: "Season 1", overview: "", poster: null, airDate: "2022-02-18", episodeCount: 9, rating: 8.3 },
        ],
        keywords: [{ id: 1, name: "workplace" }],
      }),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/title/tv/301"]}>
        <Routes>
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("TV-MA")).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "Stream on Apple TV+" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Ben Stiller/ }).getAttribute("href")).toBe("/person/8");
    expect(screen.getByRole("link", { name: /Adam Scott/ }).getAttribute("href")).toBe("/person/7");
    expect(screen.getByText("Good News About Hell")).not.toBeNull();
    expect(screen.getByText("workplace").closest("a")?.getAttribute("href")).toBe("/browse/keyword/1?type=tv");
    expect(
      screen.getByRole("button", { name: "Season 1 episode 9, The We We Are: 9.6" }),
    ).not.toBeNull();
    expect(screen.getAllByText(/Availability data by/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /play trailer/i }));
    const player = screen.getByTitle("Severance video") as HTMLIFrameElement;
    expect(player.src).toContain("youtube-nocookie.com/embed/YoHD9XEInc0");
  });
});
