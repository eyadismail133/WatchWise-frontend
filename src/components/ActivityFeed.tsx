import { trpc } from "../providers/trpcClient";
import { ActivityItem } from "./ActivityItem";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface ActivityFeedProps {
  /** If provided, loads a specific user's activity. Otherwise loads the following feed. */
  username?: string;
}

export function ActivityFeed({ username }: ActivityFeedProps) {
  const [, setNextCursorParam] = useState<string | undefined>(undefined);

  const userActivityQuery = trpc.activity.userActivity.useQuery(
    { username: username ?? "", limit: 20 },
    { enabled: !!username }
  );
  const feedQuery = trpc.activity.feed.useQuery(
    { limit: 20 },
    { enabled: !username }
  );

  const query = username ? userActivityQuery : feedQuery;
  const items = query.data?.items ?? [];
  const nextCursor = query.data?.nextCursor;

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No activity yet.</p>
        {!username && <p className="text-sm mt-1">Follow some users to see their activity here.</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border/50">
        {items.map((item: any) => (
          <ActivityItem key={item.id} activity={item} />
        ))}
      </div>
      {nextCursor && (
        <div className="pt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setNextCursorParam(nextCursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
