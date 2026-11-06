import { Link } from "react-router";
import { motion } from "motion/react";
import { Compass, Search, BookmarkPlus, Rss, CalendarDays, BookOpen } from "lucide-react";
import { ease } from "../lib/motion";

const links = [
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Release calendar", href: "/calendar", icon: CalendarDays },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Search", href: "/search", icon: Search },
  { label: "Watchlist", href: "/watchlist", icon: BookmarkPlus },
  { label: "Feed", href: "/feed", icon: Rss },
];

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/[0.06] text-sm text-muted-foreground">
      <div aria-hidden="true" className="gold-hairline absolute inset-x-0 top-0 h-px" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: ease.out }}
        className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-6"
      >
        <div>
          <p className="font-display text-lg font-bold text-foreground">WatchWise</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            Find the right movie or show for tonight — with AI picks, rich
            cast &amp; crew pages, trailers, and where-to-watch info.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/80">Explore</p>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="group inline-flex items-center gap-2 hover:text-[#e8c866]">
                  <l.icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/80">WatchWise</p>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-[#e8c866]">About</Link></li>
            <li><Link to="/faq" className="hover:text-[#e8c866]">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-[#e8c866]">Contact</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/80">Legal</p>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy-policy" className="hover:text-[#e8c866]">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-[#e8c866]">Terms of Service</Link>
            </li>
          </ul>
        </div>
      </motion.div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>© {new Date().getFullYear()} WatchWise. Built for movie and show discovery.</p>
          <p>
            Data &amp; images from{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="text-[#01b4e4] hover:underline">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
