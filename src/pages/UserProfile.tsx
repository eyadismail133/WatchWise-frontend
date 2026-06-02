import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { trpc } from "../providers/trpcClient";
import { useAuth } from "../hooks/useAuth";
import { FollowButton } from "../components/FollowButton";
import { ActivityFeed } from "../components/ActivityFeed";
import { MovieCard } from "../components/MovieCard";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Loader2, Pencil, Lock, Heart, BookmarkPlus, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = trpc.user.getProfile.useQuery(
    { username: username! },
    { enabled: !!username }
  );
  const { data: counts } = trpc.social.followCounts.useQuery(
    { userId: profile?.id ?? 0 },
    { enabled: !!profile }
  );
  const { data: featuredData } = trpc.user.getFeaturedFavorites.useQuery(
    { username: username! },
    { enabled: !!username }
  );


  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Link to="/" className="text-[#d4a843] hover:underline text-sm mt-2 block">Go home</Link>
      </div>
    );
  }

  const isOwner = me?.id !== undefined && Number(me.id) === profile.id;
  const avatarSrc = profile.image ?? profile.avatar ?? "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <Avatar className="h-24 w-24 shrink-0 ring-4 ring-[#d4a843]/20">
            <AvatarImage src={avatarSrc} alt={profile.name} className="object-cover" />
            <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-3xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
                {profile.username && (
                  <p className="text-muted-foreground text-sm">@{profile.username}</p>
                )}
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/u/${profile.username}/edit`)}>
                    <Pencil className="w-4 h-4 mr-1.5" />
                    Edit Profile
                  </Button>
                ) : (
                  <FollowButton userId={profile.id} />
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-prose">{profile.bio}</p>
            )}

            <div className="flex gap-4 mt-3 text-sm">
              <span>
                <strong>{counts?.followers ?? 0}</strong>{" "}
                <span className="text-muted-foreground">followers</span>
              </span>
              <span>
                <strong>{counts?.following ?? 0}</strong>{" "}
                <span className="text-muted-foreground">following</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites">
          <TabsList className="mb-6">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-1.5" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-1.5" />
              Activity
            </TabsTrigger>
            {(isOwner || profile.isWatchlistPublic) && (
              <TabsTrigger value="watchlist">
                <BookmarkPlus className="w-4 h-4 mr-1.5" />
                Watchlist
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="favorites">
            {featuredData && featuredData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {featuredData.map((f: { tmdbId: number; mediaType: string }, i: number) => (
                  <FeaturedTitleCard key={`${f.mediaType}-${f.tmdbId}`} tmdbId={f.tmdbId} mediaType={f.mediaType as "movie" | "tv"} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10 text-sm">
                {isOwner
                  ? "Pick your top 5 favorites in Edit Profile."
                  : "No featured favorites yet."}
              </p>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {!isOwner && !profile.isActivityPublic ? (
              <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
                <Lock className="w-8 h-8" />
                <p>This user's activity is private.</p>
              </div>
            ) : (
              <ActivityFeed username={profile.username ?? undefined} />
            )}
          </TabsContent>

          {(isOwner || profile.isWatchlistPublic) && (
            <TabsContent value="watchlist">
              {isOwner ? (
                <p className="text-center text-muted-foreground py-10 text-sm">
                  <Link to="/watchlist" className="text-[#d4a843] hover:underline">
                    Go to your watchlist →
                  </Link>
                </p>
              ) : (
                <PublicWatchlist username={profile.username!} />
              )}
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}

function FeaturedTitleCard({ tmdbId, mediaType, index }: { tmdbId: number; mediaType: "movie" | "tv"; index: number }) {
  const { data } = trpc.movie.details.useQuery({ id: tmdbId, mediaType });
  if (!data) return <div className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />;
  return <MovieCard title={data as any} index={index} />;
}

function PublicWatchlist({ username }: { username: string }) {
  const [status, setStatus] = useState<"want_to_watch" | "watched" | undefined>(undefined);

  const { data, isLoading } = trpc.user.getPublicWatchlist.useQuery({ username, status });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "want_to_watch", "watched"] as const).map((s) => {
          const val = s === "all" ? undefined : s;
          const label = s === "all" ? "All" : s === "want_to_watch" ? "Want to watch" : "Watched";
          return (
            <Button
              key={s}
              size="sm"
              variant={status === val ? "default" : "outline"}
              onClick={() => setStatus(val)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">
          {status === "watched" ? "No watched titles yet." : status === "want_to_watch" ? "No titles in watchlist yet." : "Watchlist is empty."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(data as any[]).map((item: any, i: number) => (
            <MovieCard
              key={item.id}
              title={item.title as any}
              index={i}
              showQuickActions={false}
              userStatus={item.status}
              userRate={item.userRating ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
