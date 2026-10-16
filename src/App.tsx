import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { ScrollToTop } from "./components/ScrollToTop";
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

function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center gap-3"
    >
      <div className="w-10 h-10 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Loading page...</span>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/taste" element={<TasteProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
          <Route path="/title/:id" element={<TitleDetail />} />
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/u/:username/edit" element={<EditProfile />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/users" element={<UserSearch />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
