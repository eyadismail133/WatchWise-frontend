import { Routes, Route } from "react-router";
import { AppLayout } from "./components/AppLayout";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Search from "./pages/Search";
import Watchlist from "./pages/Watchlist";
import TasteProfile from "./pages/TasteProfile";
import TitleDetail from "./pages/TitleDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/taste" element={<TasteProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/title/:mediaType/:id" element={<TitleDetail />} />
        <Route path="/title/:id" element={<TitleDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}
