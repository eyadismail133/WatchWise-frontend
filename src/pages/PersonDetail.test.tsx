// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import PersonDetail from "./PersonDetail";

const credit = (id: number, mediaType: "movie" | "tv", title: string, year: number) => ({
  id,
  mediaType,
  title,
  poster: null,
  backdrop: null,
  releaseDate: `${year}-01-01`,
  year,
  role: "Lead",
  rating: 7,
  voteCount: 100,
  popularity: 1,
  episodeCount: mediaType === "tv" ? 10 : null,
});

const personQuery = vi.fn();

vi.mock("../providers/trpcClient", () => ({
  trpc: {
    movie: { person: { useQuery: (...a: unknown[]) => personQuery(...a) } },
    watchlist: {
      statusMap: { useQuery: () => ({ data: undefined }) },
      add: { useMutation: () => ({ mutate: vi.fn() }) },
      update: { useMutation: () => ({ mutate: vi.fn() }) },
      remove: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    useUtils: () => ({}),
  },
}));
vi.mock("../hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, isLoading: false, user: null }) }));

const person = {
  id: 9,
  name: "Ada Moreno",
  biography: "An actor.",
  birthday: "1986-04-12",
  deathday: null,
  placeOfBirth: "Reykjavík, Iceland",
  knownForDepartment: "Acting",
  gender: "female",
  alsoKnownAs: [],
  homepage: null,
  image: null,
  imageHd: null,
  popularity: 1,
  photos: [],
  externalIds: { imdb: "nm1", instagram: null, twitter: null, facebook: null, tiktok: null },
  knownFor: [],
  cast: [credit(1, "movie", "Paper Moons", 2020), credit(2, "tv", "Glass Harbor", 2018)],
  crew: [],
  stats: { totalCredits: 2, movies: 1, shows: 1, averageRating: 7, firstYear: 2018, latestYear: 2020 },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/person/9"]}>
      <Routes>
        <Route path="/person/:id" element={<PersonDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PersonDetail", () => {
  afterEach(cleanup);

  it("shows biography facts, external links and a year-grouped filmography", () => {
    personQuery.mockReturnValue({ data: person, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Ada Moreno" })).not.toBeNull();
    expect(screen.getByText("Reykjavík, Iceland")).not.toBeNull();
    expect(screen.getByRole("link", { name: /IMDb/ }).getAttribute("href")).toBe("https://www.imdb.com/name/nm1");
    const filmography = screen.getByRole("region", { name: "Filmography" });
    expect(within(filmography).getByText("2020")).not.toBeNull();
    expect(within(filmography).getByRole("link", { name: /Paper Moons/ }).getAttribute("href")).toBe("/title/movie/1");
  });

  it("filters credits to TV only", async () => {
    personQuery.mockReturnValue({ data: person, isLoading: false, isError: false });
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: /^TV$/ }));
    const filmography = screen.getByRole("region", { name: "Filmography" });
    await waitFor(() =>
      expect(within(filmography).queryByRole("link", { name: /Paper Moons/ })).toBeNull(),
    );
    expect(within(filmography).getByRole("link", { name: /Glass Harbor/ }).getAttribute("href")).toBe("/title/tv/2");
  });

  it("offers a retry when the person request fails", () => {
    const refetch = vi.fn();
    personQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
