import { Link } from "react-router";
import { ThumbsUp, ThumbsDown, EyeOff, Sparkles, Diamond } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "../providers/trpcClient";

interface Recommendation {
  id: number;
  titleId: number;
  title: {
    id: number;
    title: string;
    type: "movie" | "series";
    posterUrl: string;
    rating: number;
    releaseYear: number;
    genres: string[];
    moods: string[];
    hiddenGemScore?: number;
  };
  explanation: string;
  matchReason: string;
  confidence: number;
  moodTags: string[];
  isHiddenGem: boolean;
  userFeedback?: "positive" | "negative" | "neutral";
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  variant?: "featured" | "standard";
  index?: number;
  onFeedback?: (
    recId: number,
    feedback: "positive" | "negative" | "neutral",
  ) => void;
}

export function RecommendationCard({
  recommendation,
  variant = "standard",
  index = 0,
  onFeedback,
}: RecommendationCardProps) {
  const feedbackMutation = trpc.recommendation.feedback.useMutation();
  const isFeatured = variant === "featured";

  const handleFeedback = (type: "positive" | "negative" | "neutral") => {
    feedbackMutation.mutate({ id: recommendation.id, feedback: type });
    onFeedback?.(recommendation.id, type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative rounded-2xl overflow-hidden card-shadow ${
        isFeatured ? "col-span-2" : ""
      }`}
    >
      <Link to={`/title/${recommendation.titleId}`}>
        <div
          className={`relative ${isFeatured ? "flex flex-col md:flex-row" : ""}`}
        >
          {/* Poster */}
          <div
            className={`relative overflow-hidden ${
              isFeatured
                ? "w-full md:w-2/5 aspect-[3/4] md:aspect-auto md:min-h-[400px]"
                : "aspect-[3/4]"
            }`}
          >
            <img
              src={recommendation.title.posterUrl}
              alt={recommendation.title.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Hidden Gem Badge */}
            {recommendation.isHiddenGem && (
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#8a6fbf] text-white text-xs font-bold flex items-center gap-1.5">
                <Diamond className="w-3.5 h-3.5" />
                Hidden Gem
              </div>
            )}

            {/* Confidence Score */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d4a843]" />
              {recommendation.confidence}%
            </div>
          </div>

          {/* Content */}
          <div
            className={`bg-card p-5 ${isFeatured ? "flex-1 flex flex-col justify-between" : ""}`}
          >
            <div>
              <h3
                className={`font-display font-bold text-foreground ${
                  isFeatured ? "text-2xl" : "text-lg"
                }`}
              >
                {recommendation.title.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{recommendation.title.releaseYear}</span>
                <span>·</span>
                <span className="capitalize">{recommendation.title.type}</span>
                <span>·</span>
                <span className="text-[#d4a843]">
                  {recommendation.title.rating.toFixed(1)}
                </span>
              </div>

              {/* AI Explanation */}
              <div className="mt-4 p-4 rounded-xl bg-[#8a6fbf]/10 border border-[#8a6fbf]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#8a6fbf]" />
                  <span className="text-xs font-semibold text-[#8a6fbf] uppercase tracking-wide">
                    Why WatchWise Recommends This
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {recommendation.explanation}
                </p>
              </div>

              {/* Mood Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {recommendation.moodTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground capitalize"
                  >
                    {tag.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Feedback Buttons */}
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleFeedback("positive");
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  recommendation.userFeedback === "positive"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted hover:bg-green-500/10 hover:text-green-400 text-muted-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Great Pick
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleFeedback("negative");
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  recommendation.userFeedback === "negative"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-muted hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Not For Me
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleFeedback("neutral");
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  recommendation.userFeedback === "neutral"
                    ? "bg-muted-foreground/20 text-muted-foreground"
                    : "bg-muted hover:bg-muted-foreground/10 text-muted-foreground"
                }`}
              >
                <EyeOff className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
