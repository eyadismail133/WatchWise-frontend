import { useState } from "react";
import { trpc } from "../providers/trpcClient";
import { useAuth } from "../hooks/useAuth";
import { CommentItem } from "./CommentItem";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface CommentsSectionProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export function CommentsSection({ tmdbId, mediaType }: CommentsSectionProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");

  const { data: comments, isLoading } = trpc.comment.list.useQuery({ tmdbId, mediaType });

  const add = trpc.comment.add.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ tmdbId, mediaType });
      setBody("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!body.trim()) return;
    add.mutate({ tmdbId, mediaType, body });
  };

  return (
    <motion.section
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Comments
        {comments && comments.length > 0 && (
          <span className="text-base font-normal text-muted-foreground ml-1">({comments.length})</span>
        )}
      </h2>

      <div className="space-y-3 mb-8">
        <Textarea
          placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to comment"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[80px] resize-none"
          maxLength={2000}
          disabled={!isAuthenticated}
          onFocus={() => { if (!isAuthenticated) navigate("/login"); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{body.length}/2000</span>
          <Button
            onClick={handleSubmit}
            disabled={add.isPending || !body.trim()}
            size="sm"
          >
            {add.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Post comment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y divide-border/50">
          {comments.map((c: any) => (
            <CommentItem
              key={c.id}
              comment={c}
              tmdbId={tmdbId}
              mediaType={mediaType}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8 text-sm">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </motion.section>
  );
}
