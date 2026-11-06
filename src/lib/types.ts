import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../contracts/app-router";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

export type RichTitle = RouterOutputs["movie"]["details"];
export type PersonDetail = RouterOutputs["movie"]["person"];
export type PersonSummary = RouterOutputs["movie"]["trendingPeople"]["results"][number];
export type CreditItem = PersonDetail["cast"][number];
export type SeasonDetail = RouterOutputs["movie"]["season"];
export type CollectionDetail = RouterOutputs["movie"]["collection"];
export type VideoItem = RichTitle["videos"][number];
export type GalleryImage = RichTitle["gallery"]["backdrops"][number];
export type ProviderItem = NonNullable<RichTitle["watchProviders"]>["stream"][number];

export function mediaPath(mediaType: string | undefined | null, id: number) {
  return `/title/${mediaType === "tv" ? "tv" : "movie"}/${id}`;
}

export function formatMoney(value: number | null | undefined) {
  if (!value) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRuntime(minutes: number | null | undefined) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function ageFrom(birthday: string | null, deathday: string | null) {
  if (!birthday) return null;
  const start = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) age--;
  return age;
}
