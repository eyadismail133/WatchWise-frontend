// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MovieCard, type TitleData } from "./MovieCard";

const authState = { isAuthenticated: false };
const statusMapData: { id: number; tmdbId: number; mediaType: string; status: string; userRating: number | null }[] = [];
const addMock = vi.fn();
const removeMock = vi.fn();
const updateMock = vi.fn();
const toastError = vi.fn();

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ ...authState, user: null, isLoading: false }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) } }));
vi.mock("@/providers/trpcClient", () => ({
  trpc: {
    watchlist: {
      statusMap: { useQuery: () => ({ data: authState.isAuthenticated ? statusMapData : undefined }) },
      add: { useMutation: () => ({ mutate: addMock, isPending: false }) },
      update: { useMutation: () => ({ mutate: updateMock, isPending: false }) },
      remove: { useMutation: () => ({ mutate: removeMock, isPending: false }) },
    },
    useUtils: () => ({
      watchlist: {
        getByTitle: { invalidate: vi.fn() },
        statusMap: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    }),
  },
}));

const title: TitleData = {
  id: 42,
  title: "Arrival",
  type: "movie",
  description: "Linguist meets heptapods.",
  genres: ["Drama", "Sci-Fi"],
  moods: [],
  rating: 7.6,
  popularity_score: 10,
  hidden_gem_score: 0,
  poster_path: "https://image.tmdb.org/t/p/w500/p.jpg",
  backdrop_path: null,
  releaseDate: "2016-11-10",
  mediaType: "movie",
};

function renderCard() {
  return render(
    <MemoryRouter>
      <MovieCard title={title} />
    </MemoryRouter>,
  );
}

describe("MovieCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    statusMapData.length = 0;
  });
  afterEach(cleanup);

  it("links to the movie route and shows rating, year and type", () => {
    renderCard();
    const link = screen.getByRole("link", { name: "Arrival (2016)" });
    expect(link.getAttribute("href")).toBe("/title/movie/42");
    expect(screen.getByText("7.6")).not.toBeNull();
    expect(screen.getByText(/2016 · Movie/)).not.toBeNull();
  });

  it("asks signed-out users to sign in instead of mutating", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Add Arrival to watchlist" }));
    expect(toastError).toHaveBeenCalledWith("Sign in to use watchlist and favorites");
    expect(addMock).not.toHaveBeenCalled();
  });

  it("reads status from the shared status map and removes on second click", () => {
    authState.isAuthenticated = true;
    statusMapData.push({ id: 9, tmdbId: 42, mediaType: "movie", status: "want_to_watch", userRating: null });
    renderCard();
    const btn = screen.getByRole("button", { name: "Remove Arrival from watchlist" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(removeMock).toHaveBeenCalledWith({ id: 9 });
  });

  it("adds a new title with its TMDB identity", () => {
    authState.isAuthenticated = true;
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Add Arrival to watchlist" }));
    expect(addMock).toHaveBeenCalledWith({ tmdbId: 42, mediaType: "movie", status: "want_to_watch" });
  });
});
