import { Link } from "react-router";
import { motion } from "motion/react";
import { User } from "lucide-react";
import { cappedDelay, ease, spring } from "../lib/motion";

interface PersonCardProps {
  id: number;
  name: string;
  image: string | null;
  caption?: string | null;
  secondary?: string | null;
  index?: number;
  size?: "md" | "sm";
  highlight?: boolean;
}

/** Circular portrait with a gold ring that blooms on hover. Links to /person/:id. */
export function PersonCard({
  id,
  name,
  image,
  caption,
  secondary,
  index = 0,
  size = "md",
  highlight = false,
}: PersonCardProps) {
  const dim = size === "md" ? "h-28 w-28 sm:h-32 sm:w-32" : "h-20 w-20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: ease.out, delay: cappedDelay(index, 0.035) }}
    >
      <Link
        to={`/person/${id}`}
        className="group flex flex-col items-center text-center rounded-xl p-1"
        aria-label={caption ? `${name}, ${caption}` : name}
      >
        <motion.div
          whileHover={{ scale: 1.06, y: -4 }}
          whileTap={{ scale: 0.95 }}
          transition={spring.snappy}
          className={`relative ${dim} rounded-full p-[2px] ${
            highlight
              ? "bg-gradient-to-br from-[#d4a843] to-[#8a6fbf]"
              : "bg-white/10 group-hover:bg-gradient-to-br group-hover:from-[#d4a843] group-hover:to-[#8a6fbf]"
          } transition-colors duration-300`}
        >
          <div className="h-full w-full overflow-hidden rounded-full bg-card">
            {image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-card">
                <User className="h-1/3 w-1/3 text-muted-foreground/50" aria-hidden="true" />
              </div>
            )}
          </div>
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 shadow-[0_0_40px_rgba(212,168,67,0.35)] transition-opacity duration-300 group-hover:opacity-100" />
        </motion.div>
        <span className="mt-3 line-clamp-1 text-sm font-semibold group-hover:text-[#e8c866] transition-colors">
          {name}
        </span>
        {caption && (
          <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{caption}</span>
        )}
        {secondary && (
          <span className="mt-0.5 line-clamp-1 text-[11px] text-[#d4a843]/80">{secondary}</span>
        )}
      </Link>
    </motion.div>
  );
}
