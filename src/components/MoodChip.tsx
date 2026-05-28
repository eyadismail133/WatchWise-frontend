import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface MoodChipProps {
  mood: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const moodIcons: Record<string, string> = {
  "thought-provoking": "💡",
  emotional: "❤️",
  dark: "🌑",
  funny: "😄",
  suspenseful: "🔍",
  "visual spectacle": "🎨",
  "action-packed": "💥",
  "slow-burn": "⏳",
  "mind-bending": "🌀",
  "binge-worthy": "📺",
};

export function MoodChip({ mood, selected = false, onClick, size = "md" }: MoodChipProps) {
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 border ${sizeClasses} ${
        selected
          ? "bg-[#8a6fbf] text-white border-[#8a6fbf]"
          : "bg-card text-muted-foreground border-border/50 hover:border-[#8a6fbf]/50 hover:text-foreground"
      }`}
    >
      <span>{moodIcons[mood] || "✨"}</span>
      <span className="capitalize">{mood.replace(/-/g, " ")}</span>
      {selected && <Sparkles className="w-3.5 h-3.5 ml-0.5" />}
    </motion.button>
  );
}
