import { useState } from "react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { trpc } from "../providers/trpcClient";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { MessageSquare, Pencil, Trash2, CornerDownRight } from "lucide-react";

interface CommentUser {
  id: number;
  name: string;
  username: string | null;
  image: string | null;
  avatar: string | null;
}

export interface CommentData {
  id: number;
  userId: number;
  body: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  user: CommentUser;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  tmdbId: number;
  mediaType: "movie" | "tv";
  depth?: number;
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommentItem({ comment, tmdbId, mediaType, depth = 0 }: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);

  const isDeleted = !!comment.deletedAt;
  const isOwner = user?.id !== undefined && Number(user.id) === comment.userId;

  const addReply = trpc.comment.add.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ tmdbId, mediaType });
      setReplyText("");
      setReplying(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const update = trpc.comment.update.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ tmdbId, mediaType });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = trpc.comment.remove.useMutation({
    onSuccess: () => utils.comment.list.invalidate({ tmdbId, mediaType }),
    onError: (err) => toast.error(err.message),
  });

  const profileUrl = comment.user.username ? `/u/${comment.user.username}` : "#";

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-border/40 pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <Link to={profileUrl} className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.image ?? comment.user.avatar ?? ""} alt={comment.user.name} className="object-cover" />
            <AvatarFallback className="bg-[#d4a843]/20 text-[#d4a843] text-xs">
              {comment.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <Link to={profileUrl} className="font-medium text-sm hover:underline">
              {comment.user.name}
            </Link>
            {comment.user.username && (
              <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => update.mutate({ id: comment.id, body: editText })} disabled={update.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${isDeleted ? "text-muted-foreground italic" : ""}`}>
              {comment.body}
            </p>
          )}

          {!isDeleted && !editing && (
            <div className="flex items-center gap-2 mt-1.5">
              {isAuthenticated && depth < 2 && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setEditText(comment.body); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate({ id: comment.id })}
                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5 items-center text-xs text-muted-foreground mb-1">
                <CornerDownRight className="w-3 h-3" />
                Replying to @{comment.user.username ?? comment.user.name}
              </div>
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addReply.mutate({ tmdbId, mediaType, body: replyText, parentId: comment.id })}
                  disabled={addReply.isPending || !replyText.trim()}
                >
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(comment.replies ?? []).map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          tmdbId={tmdbId}
          mediaType={mediaType}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
