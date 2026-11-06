import { useCallback, useSyncExternalStore } from "react";

const KEY = "watchwise:region";
const EVENT = "watchwise:region-change";

export const REGIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "TR", name: "Türkiye" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
];

function detect(): string {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && /^[A-Z]{2}$/.test(saved)) return saved;
  } catch {
    // storage unavailable — fall back to the browser language
  }
  const fromLang = typeof navigator !== "undefined" ? navigator.language?.split("-")[1]?.toUpperCase() : undefined;
  return fromLang && /^[A-Z]{2}$/.test(fromLang) ? fromLang : "US";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Viewer's streaming region (ISO 3166-1), remembered per browser. */
export function useRegion() {
  const region = useSyncExternalStore(subscribe, detect, () => "US");
  const setRegion = useCallback((code: string) => {
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      // ignore: the choice just won't persist
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [region, setRegion] as const;
}
