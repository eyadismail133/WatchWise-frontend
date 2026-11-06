import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { AppLayout } from "./components/AppLayout";
import { pageTransition } from "./lib/motion";
import Home from "./pages/Home";

const Discover = lazy(() => import("./pages/Discover"));
const Search = lazy(() => import("./pages/Search"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const TasteProfile = lazy(() => import("./pages/TasteProfile"));
const TitleDetail = lazy(() => import("./pages/TitleDetail"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Feed = lazy(() => import("./pages/Feed"));
const UserSearch = lazy(() => import("./pages/UserSearch"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PersonDetail = lazy(() => import("./pages/PersonDetail"));
const Collection = lazy(() => import("./pages/Collection"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Browse = lazy(() => import("./pages/Browse"));
const About = lazy(() => import("./pages/About"));
const Faq = lazy(() => import("./pages/Faq"));
const Contact = lazy(() => import("./pages/Contact"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideArticle = lazy(() => import("./pages/GuideArticle"));

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center gap-3"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#d4a843]/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#d4a843]" />
      </div>
      <span className="sr-only">Loading page...</span>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AppLayout>
      {/* Route-level choreography: old page fades up and out, then the next one rises in. */}
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() =>
          window.scrollTo({ top: 0, left: 0, behavior: "instant" })
        }
      >
        <motion.div
          key={location.pathname}
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
        >
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/search" element={<Search />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/taste" element={<TasteProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
              <Route path="/title/:id" element={<TitleDetail />} />
              <Route path="/person/:id" element={<PersonDetail />} />
              <Route path="/collection/:id" element={<Collection />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/browse/:kind/:id" element={<Browse />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideArticle />} />
              <Route path="/u/:username" element={<UserProfile />} />
              <Route path="/u/:username/edit" element={<EditProfile />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/users" element={<UserSearch />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}
