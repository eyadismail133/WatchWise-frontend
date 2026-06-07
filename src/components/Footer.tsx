import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border/50 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm">
          © {new Date().getFullYear()} WatchWise. Built for movie and show
          discovery.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <Link to="/privacy-policy" className="text-[#d4a843] hover:underline">
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            className="text-[#d4a843] hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
