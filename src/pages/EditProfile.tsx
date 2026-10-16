import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router";
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

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../contracts/app-router";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type ProfileData = RouterOutputs["user"]["getMyProfile"];
export type FavoriteItem = RouterOutputs["favorite"]["list"][number];

export interface EditProfileFormProps {
  profile: ProfileData;
  favorites: FavoriteItem[];
}

export function EditProfileForm({ profile, favorites }: EditProfileFormProps) {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const utils = trpc.useUtils();

  // Per-field draft overrides: undefined means untouched (fall back to current profile prop)
  const [nameDraft, setNameDraft] = useState<string | undefined>(undefined);
  const [bioDraft, setBioDraft] = useState<string | undefined>(undefined);
  const [usernameDraft, setUsernameDraft] = useState<string | undefined>(undefined);
  const [isWatchlistPublicDraft, setIsWatchlistPublicDraft] = useState<boolean | undefined>(undefined);
  const [isActivityPublicDraft, setIsActivityPublicDraft] = useState<boolean | undefined>(undefined);
  const [featuredDraft, setFeaturedDraft] = useState<
    { tmdbId: number; mediaType: "movie" | "tv" }[] | undefined
  >(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Derive current display values: use draft override if explicitly edited, else latest prop
  const currentName = nameDraft !== undefined ? nameDraft : (profile.name ?? "");
  const currentBio = bioDraft !== undefined ? bioDraft : (profile.bio ?? "");
  const currentUsername = usernameDraft !== undefined ? usernameDraft : (profile.username ?? "");
  const currentIsWatchlistPublic =
    isWatchlistPublicDraft !== undefined ? isWatchlistPublicDraft : profile.isWatchlistPublic;
  const currentIsActivityPublic =
    isActivityPublicDraft !== undefined ? isActivityPublicDraft : profile.isActivityPublic;

  // Derive featured items: use draft override if edited (including []), else server featuredRank order
  const serverFeatured = useMemo(() => {
    return favorites
      .filter((f) => f.featuredRank != null)
      .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0))
      .map((f) => ({ tmdbId: f.tmdbId, mediaType: f.mediaType }));
  }, [favorites]);

  const currentFeatured = featuredDraft !== undefined ? featuredDraft : serverFeatured;

  const debouncedUsername = useDebounce(currentUsername, 400);
  const { data: usernameCheck } = trpc.user.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && debouncedUsername !== profile.username }
  );
  const usernameAvailable =
    debouncedUsername === profile.username ||
    (debouncedUsername.length >= 3 && Boolean(usernameCheck?.available));

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
    onSuccess: () => utils.user.getFeaturedFavorites.invalidate({ username: profile.username ?? "" }),
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

  const toggleFeatured = (tmdbId: number, mediaType: "movie" | "tv") => {
    const prev = currentFeatured;
    const exists = prev.some((f) => f.tmdbId === tmdbId && f.mediaType === mediaType);
    if (exists) {
      setFeaturedDraft(prev.filter((f) => !(f.tmdbId === tmdbId && f.mediaType === mediaType)));
    } else {
      if (prev.length >= 5) {
        toast.error("You can only feature up to 5 titles.");
        return;
      }
      setFeaturedDraft([...prev, { tmdbId, mediaType }]);
    }
  };

  const handleSave = async () => {
    const tasks: Promise<unknown>[] = [];

    // 1. Profile fields (name, bio) - submit ONLY if explicitly edited and different from server
    const profileUpdates: { name?: string; bio?: string } = {};
    if (nameDraft !== undefined && nameDraft !== profile.name) {
      profileUpdates.name = nameDraft;
    }
    if (bioDraft !== undefined && bioDraft !== (profile.bio ?? "")) {
      profileUpdates.bio = bioDraft;
    }
    if (Object.keys(profileUpdates).length > 0) {
      tasks.push(updateProfile.mutateAsync(profileUpdates));
    }

    // 2. Username - submit ONLY if explicitly edited, valid length (>= 3), different from server, and available
    let destinationUsername = profile.username ?? "";
    const isUsernameEligible =
      usernameDraft !== undefined &&
      usernameDraft.length >= 3 &&
      usernameDraft !== (profile.username ?? "") &&
      usernameAvailable;

    if (isUsernameEligible) {
      tasks.push(
        setUsernameMutation.mutateAsync({ username: usernameDraft }).then(() => {
          destinationUsername = usernameDraft;
        })
      );
    }

    // 3. Privacy fields - submit ONLY if explicitly edited and different from server
    const privacyUpdates: { isWatchlistPublic?: boolean; isActivityPublic?: boolean } = {};
    if (isWatchlistPublicDraft !== undefined && isWatchlistPublicDraft !== profile.isWatchlistPublic) {
      privacyUpdates.isWatchlistPublic = isWatchlistPublicDraft;
    }
    if (isActivityPublicDraft !== undefined && isActivityPublicDraft !== profile.isActivityPublic) {
      privacyUpdates.isActivityPublic = isActivityPublicDraft;
    }
    if (Object.keys(privacyUpdates).length > 0) {
      tasks.push(updatePrivacy.mutateAsync(privacyUpdates));
    }

    // 4. Featured favorites - submit ONLY if explicitly edited
    if (featuredDraft !== undefined) {
      tasks.push(
        setFeaturedFavorites.mutateAsync({
          items: featuredDraft.map((f) => ({ tmdbId: f.tmdbId, mediaType: f.mediaType })),
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
      navigate(`/u/${destinationUsername}`);
    } catch {
      // individual errors already toasted
    }
  };

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
            value={currentName}
            onChange={(e) => setNameDraft(e.target.value)}
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
              value={currentUsername}
              onChange={(e) => setUsernameDraft(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
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
            value={currentBio}
            onChange={(e) => setBioDraft(e.target.value)}
            maxLength={500}
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{currentBio.length}/500</p>
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
              <span className="text-[#d4a843]">{currentFeatured.length}/5 selected</span>
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="border border-dashed border-border/50 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No favorites yet. Add some titles to your favorites first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {favorites.map((fav) => {
                const title = fav.title;
                if (!title) return null;
                const isSelected = currentFeatured.some(
                  (f) => f.tmdbId === fav.tmdbId && f.mediaType === fav.mediaType
                );
                const selectionIndex = currentFeatured.findIndex(
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

          {currentFeatured.length > 0 && (
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
              <Label htmlFor="public-watchlist-switch">Public watchlist</Label>
              <p className="text-xs text-muted-foreground">Others can see your watchlist</p>
            </div>
            <Switch
              id="public-watchlist-switch"
              checked={currentIsWatchlistPublic}
              onCheckedChange={(val) => setIsWatchlistPublicDraft(val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-activity-switch">Public activity</Label>
              <p className="text-xs text-muted-foreground">Others can see your activity feed</p>
            </div>
            <Switch
              id="public-activity-switch"
              checked={currentIsActivityPublic}
              onCheckedChange={(val) => setIsActivityPublicDraft(val)}
            />
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

export interface AuthenticatedEditProfileProps {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
}

export function AuthenticatedEditProfile({ user }: AuthenticatedEditProfileProps) {
  const profileQuery = trpc.user.getMyProfile.useQuery(undefined, {
    refetchOnMount: "always",
  });

  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    refetchOnMount: "always",
  });

  // Identity validation: cached profile must belong to the currently authenticated user
  const isProfileOwned = Boolean(
    profileQuery.data && String(profileQuery.data.id) === String(user.id)
  );

  // Favorites must belong to the current user (reject foreign cached rows from another account)
  const hasForeignFavorites = Boolean(
    favoritesQuery.data &&
      favoritesQuery.data.some(
        (item) => item != null && String(item.userId) !== String(user.id)
      )
  );

  const isFavoritesOwned = Boolean(
    favoritesQuery.data && !hasForeignFavorites
  );

  const ownedFavorites = useMemo(() => {
    return (favoritesQuery.data ?? []).filter(
      (item): item is FavoriteItem => item != null && String(item.userId) === String(user.id)
    );
  }, [favoritesQuery.data, user.id]);

  // 1. If we have current-account-owned profile and favorites, render the form!
  // This preserves the mounted form and user drafts even during background fetches or refetch errors.
  if (isProfileOwned && isFavoritesOwned && profileQuery.data) {
    return (
      <EditProfileForm
        profile={profileQuery.data}
        favorites={ownedFavorites}
      />
    );
  }

  // 2. If we do NOT have current-account-owned data and a query is actively loading/fetching, show the spinner.
  if (
    profileQuery.isLoading ||
    favoritesQuery.isLoading ||
    profileQuery.isFetching ||
    favoritesQuery.isFetching
  ) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 3. If we do not have current-account data and nothing is actively loading (e.g. query failed or stale mismatch),
  // display deliberate error / retry UI.
  const errorMessage =
    profileQuery.error?.message ||
    favoritesQuery.error?.message ||
    "Failed to load profile data for the current account.";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <p className="text-destructive font-medium">{errorMessage}</p>
      <Button
        variant="outline"
        onClick={() => {
          profileQuery.refetch();
          favoritesQuery.refetch();
        }}
      >
        Retry
      </Button>
    </div>
  );
}

export default function EditProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedEditProfile key={user.id} user={user} />;
}
