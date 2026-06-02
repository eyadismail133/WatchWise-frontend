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
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import Feed from "./pages/Feed";
import UserSearch from "./pages/UserSearch";

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
        <Route path="/u/:username" element={<UserProfile />} />
        <Route path="/u/:username/edit" element={<EditProfile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/users" element={<UserSearch />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}
