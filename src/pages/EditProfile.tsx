import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "../providers/trpcClient";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Loader2, Camera, Check, X, Star, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { uploadImageToCloudinary } from "../lib/cloudinary";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export default function EditProfile() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, refetchSession } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.user.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: favorites, isLoading: favLoading } = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [isWatchlistPublic, setIsWatchlistPublic] = useState(true);
  const [isActivityPublic, setIsActivityPublic] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Featured favorites: array of {tmdbId, mediaType} ordered by selection
  const [featuredIds, setFeaturedIds] = useState<{ tmdbId: number; mediaType: string }[]>([]);
  const [featuredDirty, setFeaturedDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      setUsername(profile.username ?? "");
      setIsWatchlistPublic(profile.isWatchlistPublic);
      setIsActivityPublic(profile.isActivityPublic);
    }
  }, [profile]);

  // Pre-select existing featured favorites once favorites load
  useEffect(() => {
    if (favorites && !featuredDirty) {
      const featured = (favorites as any[])
        .filter((f: any) => f.featuredRank != null)
        .sort((a: any, b: any) => a.featuredRank - b.featuredRank)
        .map((f: any) => ({ tmdbId: f.tmdbId, mediaType: f.mediaType }));
      setFeaturedIds(featured);
    }
  }, [favorites, featuredDirty]);

  const debouncedUsername = useDebounce(username, 400);
  const { data: usernameCheck } = trpc.user.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && debouncedUsername !== profile?.username }
  );
  const usernameAvailable = debouncedUsername === profile?.username || usernameCheck?.available;

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.getMyProfile.invalidate();
      refetchSession();
    },
    onError: (err) => toast.error(err.message),
  });

  const setUsernameMutation = trpc.user.setUsername.useMutation({
    onSuccess: () => utils.user.getMyProfile.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const updatePrivacy = trpc.user.updatePrivacy.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const setFeaturedFavorites = trpc.user.setFeaturedFavorites.useMutation({
    onSuccess: () => utils.user.getFeaturedFavorites.invalidate({ username: profile?.username ?? "" }),
    onError: (err) => toast.error(err.message),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      await updateProfile.mutateAsync({ image: url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleFeatured = (tmdbId: number, mediaType: string) => {
    setFeaturedDirty(true);
    setFeaturedIds((prev) => {
      const exists = prev.some((f) => f.tmdbId === tmdbId && f.mediaType === mediaType);
      if (exists) {
        return prev.filter((f) => !(f.tmdbId === tmdbId && f.mediaType === mediaType));
      }
      if (prev.length >= 5) {
        toast.error("You can only feature up to 5 titles.");
        return prev;
      }
      return [...prev, { tmdbId, mediaType }];
    });
  };

  const handleSave = async () => {
    const tasks: Promise<any>[] = [];

    if (name !== profile?.name || bio !== (profile?.bio ?? "")) {
      tasks.push(updateProfile.mutateAsync({ name, bio }));
    }

    if (username !== profile?.username && usernameAvailable) {
      tasks.push(setUsernameMutation.mutateAsync({ username }));
    }

    if (isWatchlistPublic !== profile?.isWatchlistPublic || isActivityPublic !== profile?.isActivityPublic) {
      tasks.push(updatePrivacy.mutateAsync({ isWatchlistPublic, isActivityPublic }));
    }

    if (featuredDirty) {
      tasks.push(
        setFeaturedFavorites.mutateAsync({
          items: featuredIds.map((f) => ({ tmdbId: f.tmdbId, mediaType: f.mediaType as "movie" | "tv" })),
        })
      );
    }

    if (tasks.length === 0) {
      toast.success("No changes to save.");
      return;
    }

    try {
      await Promise.all(tasks);
      toast.success("Profile updated!");
      navigate(`/u/${username || profile?.username}`);
    } catch {
      // individual errors already toasted
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    navigate("/login");
    return null;
  }

  const avatarSrc = profile.image ?? profile.avatar ?? "";
  const busy =
    updateProfile.isPending ||
    setUsernameMutation.isPending ||
    updatePrivacy.isPending ||
    setFeaturedFavorites.isPending;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <h1 className="font-display text-2xl font-bold">Edit Profile</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSrc} alt={profile.name} className="object-cover" />
              <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Camera className="w-4 h-4 mr-1.5" />
                  Change photo
                </span>
              </Button>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="pl-7"
              maxLength={30}
            />
            {debouncedUsername.length >= 3 && debouncedUsername !== profile.username && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameAvailable
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <X className="w-4 h-4 text-destructive" />}
              </span>
            )}
          </div>
          {debouncedUsername.length >= 3 && debouncedUsername !== profile.username && !usernameAvailable && (
            <p className="text-xs text-destructive">Username is taken or reserved.</p>
          )}
          <p className="text-xs text-muted-foreground">3–30 characters, letters, numbers, underscores only.</p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
        </div>

        {/* Featured Favorites */}
        <div className="space-y-3">
          <div>
            <h2 className="font-medium text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#d4a843]" />
              Featured Favorites
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pick up to 5 titles to showcase on your profile.{" "}
              <span className="text-[#d4a843]">{featuredIds.length}/5 selected</span>
            </p>
          </div>

          {favLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !favorites || (favorites as any[]).length === 0 ? (
            <div className="border border-dashed border-border/50 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No favorites yet. Add some titles to your favorites first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(favorites as any[]).map((fav: any) => {
                const title = fav.title;
                if (!title) return null;
                const isSelected = featuredIds.some(
                  (f) => f.tmdbId === fav.tmdbId && f.mediaType === fav.mediaType
                );
                const selectionIndex = featuredIds.findIndex(
                  (f) => f.tmdbId === fav.tmdbId && f.mediaType === fav.mediaType
                );

                return (
                  <button
                    key={`${fav.mediaType}-${fav.tmdbId}`}
                    type="button"
                    onClick={() => toggleFeatured(fav.tmdbId, fav.mediaType)}
                    className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      isSelected
                        ? "border-[#d4a843] ring-2 ring-[#d4a843]/30"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    {title.poster_path ? (
                      <img
                        src={`${TMDB_IMG}${title.poster_path}`}
                        alt={title.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center p-2">
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {title.title}
                        </span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#d4a843] flex items-center justify-center text-[10px] font-bold text-black">
                        {selectionIndex + 1}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">
                        {title.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {featuredIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GripVertical className="w-3.5 h-3.5" />
              <span>Tap to toggle • Order reflects selection order</span>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="space-y-4">
          <h2 className="font-medium text-sm">Privacy</h2>
          <div className="flex items-center justify-between">
            <div>
              <Label>Public watchlist</Label>
              <p className="text-xs text-muted-foreground">Others can see your watchlist</p>
            </div>
            <Switch checked={isWatchlistPublic} onCheckedChange={setIsWatchlistPublic} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Public activity</Label>
              <p className="text-xs text-muted-foreground">Others can see your activity feed</p>
            </div>
            <Switch checked={isActivityPublic} onCheckedChange={setIsActivityPublic} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={busy} className="flex-1">
            {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save changes
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/u/${profile.username}`)}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
