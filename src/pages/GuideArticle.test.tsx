// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import GuideArticle from "./GuideArticle";
import site from "../content/site.json";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guides/:slug" element={<GuideArticle />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuideArticle", () => {
  afterEach(cleanup);

  it("renders the full article with section headings, metadata and related guides", () => {
    const guide = site.guides[0]!;
    renderAt(`/guides/${guide.slug}`);
    expect(screen.getByRole("heading", { level: 1, name: guide.title })).not.toBeNull();
    for (const s of guide.sections) {
      expect(screen.getByRole("heading", { level: 2, name: s.heading })).not.toBeNull();
    }
    expect(document.title).toBe(`${guide.title} · WatchWise`);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(guide.description);
    expect(screen.getAllByRole("link", { name: site.guides[1]!.title }).length).toBeGreaterThan(0);
  });

  it("shows the not-found page for an unknown guide", () => {
    renderAt("/guides/does-not-exist");
    expect(screen.getByRole("heading", { level: 1, name: "404" })).not.toBeNull();
  });
});
