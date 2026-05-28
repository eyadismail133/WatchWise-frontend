import { Link, useLocation } from "react-router";
import {
  Sparkles,
  LayoutDashboard,
  Compass,
  Search,
  BookmarkPlus,
  UserCircle,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

export const navLinks = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Search", href: "/search", icon: Search },
  { label: "Watchlist", href: "/watchlist", icon: BookmarkPlus },
  { label: "My Taste", href: "/taste", icon: UserCircle },
];

type NavbarProps = {
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
};

export function Navbar({ mobileMenuOpen, onMobileMenuToggle }: NavbarProps) {
  const location = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="../../assets/WatchWise_logo.png"
              alt="the logo of WatchWise"
              className="h-9 w-auto object-contain transition-transform duration-200"
            />
            <span className="font-display text-lg font-bold">WatchWise</span>
          </Link>
        </div>

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

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs">
                      {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {user.name ?? user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/taste">My Taste Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/watchlist">My Watchlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
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
