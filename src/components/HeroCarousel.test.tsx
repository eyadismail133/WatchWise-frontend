// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MotionGlobalConfig } from "motion/react";
import { HeroCarousel } from "./HeroCarousel";

// Assert behaviour, not animation frames: let presence exits finish instantly.
MotionGlobalConfig.skipAnimations = true;
import type { TitleData } from "./MovieCard";

const slide = (id: number, title: string): TitleData => ({
  id,
  title,
  type: "movie",
  description: `${title} synopsis`,
  genres: ["Drama"],
  moods: [],
  rating: 7.5,
  popularity_score: 1,
  hidden_gem_score: 0,
  poster_path: `https://image.tmdb.org/t/p/w500/${id}.jpg`,
  backdrop_path: `https://image.tmdb.org/t/p/w780/${id}.jpg`,
  releaseDate: "2024-01-01",
  mediaType: "movie",
});

const slides = [slide(1, "First Light"), slide(2, "Second Wind"), slide(3, "Third Act")];

function renderHero(props: Partial<Parameters<typeof HeroCarousel>[0]> = {}) {
  return render(
    <MemoryRouter>
      <HeroCarousel slides={slides} {...props} />
    </MemoryRouter>,
  );
}

async function advance(ms: number) {
  for (let t = 0; t < ms; t += 100) {
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
  }
}

describe("HeroCarousel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps auto-advancing while the mouse rests on the hero", async () => {
    renderHero();
    const hero = screen.getByRole("region", { name: "Featured titles" });
    fireEvent.mouseEnter(hero);
    expect(screen.getByRole("heading", { level: 1, name: "First Light" })).not.toBeNull();
    await advance(7100);
    expect(screen.getByRole("heading", { level: 1, name: "Second Wind" })).not.toBeNull();
    await advance(7100);
    expect(screen.getByRole("heading", { level: 1, name: "Third Act" })).not.toBeNull();
  });

  it("continues autoplay after a slide is picked with the mouse", async () => {
    renderHero();
    fireEvent.click(screen.getByRole("button", { name: "Show slide 3" }));
    await advance(300);
    expect(screen.getByRole("heading", { level: 1, name: "Third Act" })).not.toBeNull();
    await advance(7100);
    expect(screen.getByRole("heading", { level: 1, name: "First Light" })).not.toBeNull();
  });

  it("shows a skeleton, not the old intro, while loading", () => {
    renderHero({ slides: [], isLoading: true });
    expect(screen.queryByText(/Right now\./)).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull();
  });
});
