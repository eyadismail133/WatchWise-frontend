import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FollowButton } from "./FollowButton";
import { useAuth } from "../hooks/useAuth";

interface UserCardUser {
  id: number;
  name: string;
  username: string | null;
  image?: string | null;
  avatar?: string | null;
  bio?: string | null;
  _count?: { followers: number };
}

interface UserCardProps {
  user: UserCardUser;
}

export function UserCard({ user }: UserCardProps) {
  const { user: me } = useAuth();
  const profileUrl = user.username ? `/u/${user.username}` : "#";
  const avatarSrc = user.image ?? user.avatar ?? "";

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
      <Link to={profileUrl} className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatarSrc} alt={user.name} className="object-cover" />
          <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-sm">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user.name}</p>
          {user.username && (
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          )}
          {user._count && (
            <p className="text-xs text-muted-foreground">{user._count.followers} followers</p>
          )}
        </div>
      </Link>
      {me?.id !== undefined && Number(me.id) !== user.id && <FollowButton userId={user.id} />}
    </div>
  );
}
