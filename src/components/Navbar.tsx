import { Link, useLocation, useNavigate } from "react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import {
  LayoutDashboard,
  Compass,
  Search,
  BookmarkPlus,
  UserCircle,
  LogIn,
  LogOut,
  Menu,
  X,
  Rss,
  SearchIcon,
  User,
  Command as CommandIcon,
  CalendarDays,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { trpc } from "../providers/trpcClient";
import type { UserCardUser } from "./UserCard";
import { ease, spring } from "../lib/motion";
import logoWatchWise from "../../assets/WatchWise_logo.png";

// The command palette (cmdk + search UI) is only downloaded the first time it opens.
const QuickSearch = lazy(() =>
  import("./QuickSearch").then((m) => ({ default: m.QuickSearch })),
);

const navLinks = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Search", href: "/search", icon: Search },
  { label: "Watchlist", href: "/watchlist", icon: BookmarkPlus },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Taste", href: "/taste", icon: UserCircle },
];

type NavbarProps = {
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
};

export function Navbar({ mobileMenuOpen, onMobileMenuToggle }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  if (paletteOpen && !paletteLoaded) setPaletteLoaded(true);
  const [scrolled, setScrolled] = useState(false);
  const debouncedSearch = useDebounce(userSearch, 300);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // ⌘K / Ctrl+K / "/" opens the quick search palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: profile } = trpc.user.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: searchResults } = trpc.user.searchUsers.useQuery(
    { q: debouncedSearch, limit: 5 },
    { enabled: debouncedSearch.length >= 1 },
  );

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const avatarSrc = profile?.image ?? profile?.avatar ?? user?.image ?? "";
  const displayName = profile?.name ?? user?.name ?? user?.email ?? "";
  const username = profile?.username;

  const handleUserResultClick = (uname: string) => {
    setDropdownOpen(false);
    setUserSearch("");
    navigate(`/u/${uname}`);
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: ease.out }}
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled
          ? "border-white/10 bg-[#08070d]/[0.96] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)]"
          : "border-transparent bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-[height] duration-500 lg:px-6 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <Link to="/" className="group flex shrink-0 items-center gap-2">
            <motion.img
              src={logoWatchWise}
              alt="WatchWise logo"
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={spring.bouncy}
              className="h-9 w-auto object-contain"
            />
            <span className="hidden font-display text-lg font-bold tracking-wide transition-colors group-hover:text-[#e8c866] min-[400px]:inline">
              WatchWise
            </span>
          </Link>
        </div>

        <LayoutGroup id="desktop-nav">
          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? "text-[#e8c866]" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={spring.layout}
                      className="absolute inset-0 -z-10 rounded-full border border-[#d4a843]/25 bg-[#d4a843]/10"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Right: search + auth */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setPaletteOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[#d4a843]/40 hover:text-foreground"
            aria-label="Open quick search"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden items-center gap-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] md:flex">
              <CommandIcon className="h-2.5 w-2.5" aria-hidden="true" />K
            </kbd>
          </motion.button>

          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated && user ? (
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={(open) => {
                setDropdownOpen(open);
                if (!open) setUserSearch("");
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/5"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-[#d4a843]/30">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-[#d4a843]/20 text-xs text-[#d4a843]">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 p-0"
                onInteractOutside={() => setDropdownOpen(false)}
              >
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-t-md px-3 py-3 hover:bg-muted/50"
                  onClick={() => username && handleUserResultClick(username)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-[#d4a843]/20 text-sm font-bold text-[#d4a843]">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    {username ? (
                      <p className="truncate text-xs text-muted-foreground">@{username}</p>
                    ) : (
                      <p className="text-xs text-[#d4a843]">Set a username →</p>
                    )}
                  </div>
                  <User className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="space-y-1 px-2 py-2">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Find users..."
                      aria-label="Find users"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-8 border-border/50 bg-muted/30 pl-8 text-sm focus-visible:ring-[#d4a843]/30"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {debouncedSearch.length >= 1 && (
                    <div className="max-h-48 space-y-0.5 overflow-y-auto">
                      {searchResults?.items && searchResults.items.length > 0 ? (
                        searchResults.items.map((u: UserCardUser) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                            onClick={() => u.username && handleUserResultClick(u.username)}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={u.image ?? u.avatar ?? ""} alt={u.name} className="object-cover" />
                              <AvatarFallback className="bg-[#d4a843]/20 text-xs text-[#d4a843]">
                                {u.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              {u.username && (
                                <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="py-2 text-center text-xs text-muted-foreground">No users found</p>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link to="/taste">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Taste Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watchlist">
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      Watchlist
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-1">
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-[#d4a843]/40 text-[#d4a843] hover:bg-[#d4a843]/10"
              >
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.nav
            aria-label="Mobile"
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.out }}
            className="overflow-hidden border-t border-white/10 bg-[#08070d]/95 lg:hidden"
          >
            <motion.div
              className="space-y-1 px-3 py-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
            >
              {[
                ...navLinks,
                ...(isAuthenticated && username
                  ? [{ label: "My Profile", href: `/u/${username}`, icon: User }]
                  : []),
                ...(!isAuthenticated ? [{ label: "Sign In", href: "/login", icon: LogIn }] : []),
              ].map((item) => (
                <motion.div
                  key={item.href}
                  variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                >
                  <Link
                    to={item.href}
                    onClick={onMobileMenuToggle}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-[#d4a843]/10 text-[#d4a843]"
                        : item.href === "/login"
                          ? "text-[#d4a843]"
                          : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {paletteLoaded && (
        <Suspense fallback={null}>
          <QuickSearch open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      )}
    </motion.header>
  );
}
