import { Link, useLocation } from "react-router";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollProgress } from "./motion/ScrollProgress";
import {
  BookmarkPlus,
  Compass,
  LayoutDashboard,
  Search,
  UserCircle,
  Rss,
  User,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../providers/trpcClient";
import { spring } from "../lib/motion";

const baseNavLinks = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Search", href: "/search", icon: Search },
  { label: "Watchlist", href: "/watchlist", icon: BookmarkPlus },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Taste", href: "/taste", icon: UserCircle },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data: profile } = trpc.user.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const profileLink = profile?.username
    ? { label: "Profile", href: `/u/${profile.username}`, icon: User }
    : null;

  const navLinks = profileLink
    ? [...baseNavLinks.slice(0, 5), profileLink]
    : baseNavLinks;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <div aria-hidden="true" className="spotlight pointer-events-none fixed inset-0 -z-0" />
      <ScrollProgress />
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)}
      />

      <main className="relative flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />

      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#08070d]/[0.97] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <LayoutGroup id="bottom-nav">
          <div className="flex items-center justify-around py-1.5">
            {navLinks.map((item) => {
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors ${
                    isActive ? "text-[#e8c866]" : "text-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      transition={spring.layout}
                      className="absolute inset-0 -z-10 rounded-xl bg-[#d4a843]/[0.12]"
                    />
                  )}
                  <motion.span
                    animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                    transition={spring.snappy}
                    className="block"
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </motion.span>
                  <span className="text-[10px]">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </nav>
    </div>
  );
}
