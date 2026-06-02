import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
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
import logoWatchWise from "../../assets/WatchWise_logo.png";

const navLinks = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
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
  const debouncedSearch = useDebounce(userSearch, 300);

  const { data: profile } = trpc.user.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: searchResults } = trpc.user.searchUsers.useQuery(
    { q: debouncedSearch, limit: 5 },
    { enabled: debouncedSearch.length >= 1 }
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
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-7xl mx-auto">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logoWatchWise}
              alt="WatchWise logo"
              className="h-9 w-auto object-contain"
            />
            <span className="font-display text-lg font-bold">WatchWise</span>
          </Link>
        </div>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#d4a843]/10 text-[#d4a843]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: auth */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu open={dropdownOpen} onOpenChange={(open) => {
              setDropdownOpen(open);
              if (!open) setUserSearch("");
            }}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-0" onInteractOutside={() => setDropdownOpen(false)}>
                {/* Profile header */}
                <div
                  className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 cursor-pointer rounded-t-md"
                  onClick={() => username && handleUserResultClick(username)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{displayName}</p>
                    {username ? (
                      <p className="text-xs text-muted-foreground truncate">@{username}</p>
                    ) : (
                      <p className="text-xs text-[#d4a843]">Set a username →</p>
                    )}
                  </div>
                  <User className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* Inline user search */}
                <div className="px-2 py-2 space-y-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Find users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 h-8 text-sm bg-muted/30 border-border/50 focus-visible:ring-[#d4a843]/30"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {debouncedSearch.length >= 1 && (
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {searchResults?.items && searchResults.items.length > 0 ? (
                        searchResults.items.map((u: any) => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 text-left transition-colors"
                            onClick={() => u.username && handleUserResultClick(u.username)}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={u.image ?? u.avatar ?? ""} alt={u.name} className="object-cover" />
                              <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              {u.username && (
                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* Nav items */}
                <div className="p-1">
                  <DropdownMenuItem asChild>
                    <Link to="/taste">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Taste Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watchlist">
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Watchlist
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-1">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => { setDropdownOpen(false); logout(); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
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
                className="border-[#d4a843]/30 text-[#d4a843] hover:bg-[#d4a843]/10"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile expanded menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/50 px-3 py-2 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onMobileMenuToggle}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                isActive(item.href)
                  ? "bg-[#d4a843]/10 text-[#d4a843]"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          {isAuthenticated && username && (
            <Link
              to={`/u/${username}`}
              onClick={onMobileMenuToggle}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground"
            >
              <User className="w-5 h-5" />
              My Profile
            </Link>
          )}
          {!isAuthenticated && (
            <Link
              to="/login"
              onClick={onMobileMenuToggle}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#d4a843]"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
