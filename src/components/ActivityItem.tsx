import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { BookmarkPlus, Heart, Eye, Star, MessageSquare, UserPlus } from "lucide-react";

type ActivityType =
  | "added_to_watchlist"
  | "added_to_favorites"
  | "marked_watched"
  | "rated_title"
  | "reviewed_title"
  | "followed_user";

interface ActivityItemProps {
  activity: {
    id: number;
    type: ActivityType;
    tmdbId: number | null;
    mediaType: string | null;
    metadata: unknown;
    createdAt: Date | string;
    user: {
      id: number;
      name: string;
      username: string | null;
      image: string | null;
      avatar: string | null;
    };
  };
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  added_to_watchlist: { icon: BookmarkPlus, color: "text-blue-400", label: "added to watchlist", bg: "bg-blue-400/10" },
  added_to_favorites: { icon: Heart, color: "text-pink-400", label: "added to favorites", bg: "bg-pink-400/10" },
  marked_watched: { icon: Eye, color: "text-green-400", label: "watched", bg: "bg-green-400/10" },
  rated_title: { icon: Star, color: "text-yellow-400", label: "rated", bg: "bg-yellow-400/10" },
  reviewed_title: { icon: MessageSquare, color: "text-purple-400", label: "reviewed", bg: "bg-purple-400/10" },
  followed_user: { icon: UserPlus, color: "text-[#d4a843]", label: "started following", bg: "bg-[#d4a843]/10" },
};

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

export function ActivityItem({ activity }: ActivityItemProps) {
  const { user, type, tmdbId, mediaType, createdAt } = activity;
  const config = typeConfig[type] ?? typeConfig.added_to_watchlist;
  const Icon = config.icon;
  const profileUrl = user.username ? `/u/${user.username}` : "#";
  const titleUrl = tmdbId && mediaType ? `/title/${mediaType}/${tmdbId}` : null;
  const meta = activity.metadata as Record<string, unknown> | null;
  const titleName = meta?.titleName as string | undefined;
  const posterPath = meta?.posterPath as string | undefined;
  const rating = meta?.rating as number | undefined;
  const targetName = meta?.targetName as string | undefined;
  const targetUsername = meta?.targetUsername as string | undefined;

  return (
    <div className="flex gap-3 py-3.5 group">
      {/* User avatar */}
      <Link to={profileUrl} className="shrink-0 mt-0.5">
        <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-[#d4a843]/20 transition-all">
          <AvatarImage src={user.image ?? user.avatar ?? ""} alt={user.name} className="object-cover" />
          <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Action line */}
        <div className="flex items-center gap-1.5 flex-wrap leading-snug">
          <Link to={profileUrl} className="font-semibold text-sm hover:text-[#d4a843] transition-colors">
            {user.name}
          </Link>

          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>

          {type === "rated_title" && rating && (
            <span className="text-xs text-yellow-400 font-medium">
              {"★".repeat(rating)}{"☆".repeat(5 - rating)}
            </span>
          )}
        </div>

        {/* Followed user link */}
        {type === "followed_user" && (targetUsername || targetName) && (
          <Link
            to={targetUsername ? `/u/${targetUsername}` : "#"}
            className="mt-0.5 block text-sm text-[#d4a843] hover:underline font-medium truncate"
          >
            {targetUsername ? `@${targetUsername}` : targetName}
          </Link>
        )}

        {/* Title link */}
        {type !== "followed_user" && titleUrl && (
          <Link
            to={titleUrl}
            className="mt-0.5 flex items-center gap-2 group/title"
          >
            {posterPath && (
              <img
                src={`${TMDB_IMG}${posterPath}`}
                alt={titleName ?? ""}
                className="w-8 h-12 object-cover rounded shrink-0 opacity-90 group-hover/title:opacity-100 transition-opacity"
              />
            )}
            <span className="text-sm text-[#d4a843] hover:underline font-medium truncate">
              {titleName ?? "a title"}
            </span>
          </Link>
        )}

        <p className="text-xs text-muted-foreground mt-1">{timeAgo(createdAt)}</p>
      </div>

      {/* Poster on right for larger display when no inline poster */}
      {posterPath && !titleUrl && null}
    </div>
  );
}
