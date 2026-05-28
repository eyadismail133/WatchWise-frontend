import { Link, useLocation } from "react-router";
import { useState } from "react";
import { Navbar, navLinks } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)}
      />

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50">
        <div className="flex items-center justify-around py-2">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                  isActive ? "text-[#d4a843]" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
