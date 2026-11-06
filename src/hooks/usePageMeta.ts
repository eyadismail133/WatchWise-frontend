import { useEffect } from "react";
import { useLocation } from "react-router";

const SITE = "WatchWise";
const DEFAULT_DESCRIPTION =
  "WatchWise helps you decide what to watch: AI picks for your mood, trailers, cast and crew, episode ratings, release calendars and where to stream movies and TV shows.";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Per-route document title, description, canonical URL and social tags.
 * Gives search engines and ad reviewers a distinct summary of every page.
 */
export function usePageMeta(title?: string, description?: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — Find the right movie or show, right now`;
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim().slice(0, 300);
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary_large_image");

    const base = import.meta.env.VITE_SITE_URL as string | undefined;
    if (base) {
      const href = `${base.replace(/\/$/, "")}${pathname}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
      setMeta("property", "og:url", href);
    }
  }, [title, description, pathname]);
}
