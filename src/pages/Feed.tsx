import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "../providers/trpcClient";
import { ActivityItem } from "../components/ActivityItem";
import { FollowButton } from "../components/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import {
  Rss,
  Users,
  Compass,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Feed() {
  const { isAuthenticated, user: me } = useAuth();
  const navigate = useNavigate();
  const [, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading } = trpc.activity.feed.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );

  const { data: suggestedUsers } = trpc.user.searchUsers.useQuery(
    { q: "a", limit: 4 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-[#d4a843]/10 flex items-center justify-center mx-auto mb-6">
            <Rss className="w-10 h-10 text-[#d4a843]" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">Activity Feed</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Sign in to see what movies and shows the people you follow are watching, rating, and loving.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/login")} className="px-6">
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate("/discover")}>
              <Compass className="w-4 h-4 mr-1.5" />
              Browse titles
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor;
  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 flex items-center justify-center">
              <Rss className="w-5 h-5 text-[#d4a843]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-tight">Following Feed</h1>
              <p className="text-xs text-muted-foreground">Activity from people you follow</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/discover")}
            className="hidden sm:flex"
          >
            <Compass className="w-4 h-4 mr-1.5" />
            Discover
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main feed */}
          <div>
            {isLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-card border border-border/50 rounded-xl p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-10 bg-muted rounded w-20 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isEmpty && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border/50 rounded-2xl p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="font-semibold text-lg mb-2">Nothing here yet</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  Follow people to see their activity. When they watch, rate, or add titles — it shows up here.
                </p>
                <Button onClick={() => navigate("/discover")} variant="outline">
                  <Compass className="w-4 h-4 mr-1.5" />
                  Discover titles
                </Button>
              </motion.div>
            )}

            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border/50 rounded-xl px-4 hover:border-border transition-colors"
                  >
                    <ActivityItem activity={item} />
                  </motion.div>
                ))}

                {nextCursor && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCursor(nextCursor)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="w-4 h-4 mr-1.5" />
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* Suggested people */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <TrendingUp className="w-4 h-4 text-[#d4a843]" />
                <h2 className="font-semibold text-sm">People to follow</h2>
              </div>
              <div className="divide-y divide-border/30">
                {suggestedUsers?.items?.slice(0, 4).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <Link to={u.username ? `/u/${u.username}` : "#"} className="shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.image ?? u.avatar ?? ""} alt={u.name} className="object-cover" />
                        <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link to={u.username ? `/u/${u.username}` : "#"} className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      {u.username && (
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      )}
                    </Link>
                    {me?.id !== undefined && Number(me.id) !== u.id && (
                      <FollowButton userId={u.id} className="shrink-0" />
                    )}
                  </div>
                ))}
                {!suggestedUsers?.items?.length && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No suggestions right now
                  </p>
                )}
              </div>
              <div className="px-4 py-2 border-t border-border/30">
                <Link
                  to="/users"
                  className="text-xs text-[#d4a843] hover:underline"
                >
                  See all users →
                </Link>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold text-sm mb-3">Explore</h2>
              {[
                { label: "Discover titles", href: "/discover", icon: Compass },
                { label: "My Watchlist", href: "/watchlist", icon: Rss },
                { label: "Taste Profile", href: "/taste", icon: TrendingUp },
              ].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
