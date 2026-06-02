import { trpc } from "../providers/trpcClient";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  userId: number;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.social.isFollowing.useQuery({ userId }, { enabled: isAuthenticated });
  const isFollowing = data?.isFollowing ?? false;

  const follow = trpc.social.follow.useMutation({
    onSuccess: () => utils.social.isFollowing.invalidate({ userId }),
    onError: (err) => toast.error(err.message),
  });

  const unfollow = trpc.social.unfollow.useMutation({
    onSuccess: () => utils.social.isFollowing.invalidate({ userId }),
    onError: (err) => toast.error(err.message),
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isFollowing) {
      unfollow.mutate({ userId });
    } else {
      follow.mutate({ userId });
    }
  };

  const busy = isLoading || follow.isPending || unfollow.isPending;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={busy}
      className={className}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Follow
        </>
      )}
    </Button>
  );
}
