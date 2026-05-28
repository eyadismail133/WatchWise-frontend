import { trpc } from "../providers/trpcClient";
import { useAuth } from "../hooks/useAuth";
import { LogIn, Sparkles, Film, Heart, Star, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function RadarChart({ data }: { data: Record<string, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dimensions = [
    { key: "narrative", label: "Narrative" },
    { key: "visual", label: "Visual" },
    { key: "emotional", label: "Emotional" },
    { key: "pacing", label: "Pacing" },
    { key: "era", label: "Era" },
    { key: "breadth", label: "Breadth" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const maxRadius = Math.min(centerX, centerY) - 40;

    const angleStep = (Math.PI * 2) / dimensions.length;

    let progress = 0;

    const animate = () => {
      progress = Math.min(progress + 0.02, 1);

      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();

        const radius = (maxRadius / 5) * i;

        for (let j = 0; j <= dimensions.length; j++) {
          const angle = j * angleStep - Math.PI / 2;

          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < dimensions.length; i++) {
        const angle = i * angleStep - Math.PI / 2;

        ctx.beginPath();

        ctx.moveTo(centerX, centerY);

        ctx.lineTo(
          centerX + maxRadius * Math.cos(angle),
          centerY + maxRadius * Math.sin(angle),
        );

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.stroke();

        const labelRadius = maxRadius + 22;

        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(dimensions[i].label, labelX, labelY);
      }

      ctx.beginPath();

      const values = dimensions.map((d) => {
        const val = data[d.key] || 50;
        return val * progress;
      });

      for (let i = 0; i < dimensions.length; i++) {
        const angle = i * angleStep - Math.PI / 2;

        const radius = (maxRadius * values[i]) / 100;

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();

      ctx.fillStyle = "rgba(212,168,67,0.15)";
      ctx.fill();

      ctx.shadowColor = "#d4a843";
      ctx.shadowBlur = 18 * progress;

      ctx.strokeStyle = "#d4a843";
      ctx.lineWidth = 2.5;

      ctx.stroke();

      ctx.shadowBlur = 0;

      for (let i = 0; i < dimensions.length; i++) {
        const angle = i * angleStep - Math.PI / 2;

        const radius = (maxRadius * values[i]) / 100;

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();

        ctx.arc(x, y, 4, 0, Math.PI * 2);

        ctx.fillStyle = "#d4a843";
        ctx.fill();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(canvas);

    return () => observer.disconnect();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ minHeight: "300px" }}
    />
  );
}

function generateSummary(
  genres: string[],
  moods: string[],
  avgYear: number,
  avgRating: number,
) {
  const genreText = genres.slice(0, 3).join(", ");

  const moodText =
    moods.length > 0 ? moods.slice(0, 2).join(" and ") : "immersive cinematic";

  const era =
    avgYear > 2018
      ? "modern cinema"
      : avgYear > 2005
        ? "contemporary classics"
        : "timeless storytelling";

  const ratingStyle =
    avgRating > 7.5
      ? "highly curated"
      : avgRating > 6
        ? "balanced"
        : "exploratory";

  return `Your library reveals a ${ratingStyle} taste shaped by ${genreText}. You gravitate toward ${moodText} experiences and show a strong appreciation for ${era}. Your profile blends emotional resonance with cinematic variety, creating a uniquely personal viewing identity.`;
}

function calculateTasteProfile(titles: any[]) {
  if (!titles.length) {
    return {
      narrative: 50,
      visual: 50,
      emotional: 50,
      pacing: 50,
      era: 50,
      breadth: 50,
      topGenres: [],
      topMoods: [],
      personality: "Cinema Wanderer",
      summary: "Start building your library to unlock your cinematic identity.",
    };
  }

  const genreMap: Record<string, number> = {};
  const moodMap: Record<string, number> = {};

  let avgRating = 0;
  let avgYear = 0;
  let popularity = 0;
  let totalWeight = 0;

  titles.forEach((title) => {
    const weight = title.weight || 1;

    totalWeight += weight;

    avgRating += (title.voteAverage || 0) * weight;
    avgYear += Number(title.year || 2020) * weight;
    popularity += (title.popularity || 0) * weight;

    (title.genres || []).forEach((genre: string) => {
      genreMap[genre] = (genreMap[genre] || 0) + weight;
    });

    (title.moods || []).forEach((mood: string) => {
      moodMap[mood] = (moodMap[mood] || 0) + weight;
    });
  });

  avgRating /= totalWeight;
  avgYear /= totalWeight;

  const genres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const moods = Object.entries(moodMap)
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => m);

  const personality = genres.includes("Sci-Fi")
    ? "Visionary Explorer"
    : genres.includes("Drama")
      ? "Emotional Curator"
      : genres.includes("Thriller")
        ? "Tension Seeker"
        : genres.includes("Fantasy")
          ? "Dream Architect"
          : "Cinema Wanderer";

  return {
    narrative: Math.min(100, avgRating * 10),

    visual: Math.min(100, popularity / totalWeight),

    emotional: moods.includes("emotional") ? 88 : 65,

    pacing: genres.includes("Action") ? 82 : 58,

    era: avgYear > 2015 ? 86 : 62,

    breadth: Math.min(100, genres.length * 12),

    topGenres: genres.slice(0, 5),

    topMoods: moods.slice(0, 6),

    personality,

    summary: generateSummary(genres, moods, avgYear, avgRating),
  };
}

export default function TasteProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [stars] = useState(() =>
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.5,
    })),
  );

  const watchlistQuery = trpc.watchlist.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />

          <h2 className="font-display text-2xl font-bold mb-2">
            Discover Your Taste
          </h2>

          <p className="text-muted-foreground mb-6">
            Sign in to unlock your cinematic identity and personalized taste
            profile.
          </p>

          <Link to="/login">
            <Button className="bg-[#d4a843] hover:bg-[#e8c866] text-background">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const watchlistItems = watchlistQuery.data ?? [];
  const favoriteItems = favoritesQuery.data ?? [];

  const allTitles = [
    ...watchlistItems.map((i) => ({
      ...i.title,
      weight: 1,
    })),

    ...favoriteItems.map((i) => ({
      ...i.title,
      weight: 2.5,
    })),
  ].filter(Boolean);

  const profile = calculateTasteProfile(allTitles);

  const radarData = {
    narrative: profile.narrative,
    visual: profile.visual,
    emotional: profile.emotional,
    pacing: profile.pacing,
    era: profile.era,
    breadth: profile.breadth,
  };

  const stats = [
    {
      label: "Narrative Complexity",
      value: profile.narrative,
      icon: Film,
      color: "#d4a843",
    },

    {
      label: "Visual Style",
      value: profile.visual,
      icon: Sparkles,
      color: "#8a6fbf",
    },

    {
      label: "Emotional Depth",
      value: profile.emotional,
      icon: Heart,
      color: "#e86a5c",
    },

    {
      label: "Pacing Preference",
      value: profile.pacing,
      icon: TrendingUp,
      color: "#4ade80",
    },

    {
      label: "Era Preference",
      value: profile.era,
      icon: Star,
      color: "#60a5fa",
    },

    {
      label: "Genre Breadth",
      value: profile.breadth,
      icon: Film,
      color: "#f472b6",
    },
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-[#d4a843]" />

            <h1 className="font-display text-3xl font-bold">
              Your Taste Profile
            </h1>
          </div>

          <p className="text-muted-foreground mb-5">
            A cinematic reflection of your personal viewing identity
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a843]/10 border border-[#d4a843]/20 text-[#d4a843] text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {profile.personality}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/50 p-6 mb-8"
        >
          <div className="max-w-md mx-auto">
            <RadarChart data={radarData} />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${stat.color}20`,
                  }}
                >
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.color }}
                  />
                </div>

                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: stat.color,
                    }}
                  />
                </div>

                <span className="text-sm font-bold">
                  {Math.round(stat.value)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h3 className="font-display text-lg font-bold mb-4">Top Genres</h3>

            <div className="space-y-3">
              {profile.topGenres.map((genre, i) => (
                <div key={genre} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">
                    {i + 1}.
                  </span>

                  <div className="flex-1 h-8 bg-muted rounded-lg flex items-center px-3">
                    <span className="text-sm font-medium">{genre}</span>
                  </div>

                  <div
                    className="h-8 rounded-lg flex items-center px-3"
                    style={{
                      width: `${100 - i * 15}%`,
                      backgroundColor: `rgba(212,168,67,${0.3 - i * 0.05})`,
                    }}
                  >
                    <span className="text-xs text-[#d4a843]">
                      {100 - i * 15}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h3 className="font-display text-lg font-bold mb-4">Top Moods</h3>

            <div className="flex flex-wrap gap-2">
              {profile.topMoods.map((mood) => (
                <span
                  key={mood}
                  className="px-3 py-2 rounded-lg bg-[#8a6fbf]/10 text-[#8a6fbf] text-sm capitalize border border-[#8a6fbf]/20"
                >
                  {mood.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#12121a] border border-[#8a6fbf]/20 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30">
            {stars.map((star, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={star}
              />
            ))}
          </div>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#8a6fbf]" />

              <span className="text-sm font-semibold text-[#8a6fbf] uppercase tracking-wider">
                AI Taste Analysis
              </span>

              <Sparkles className="w-5 h-5 text-[#8a6fbf]" />
            </div>

            <p className="font-display text-lg italic text-foreground/90 leading-relaxed max-w-2xl mx-auto">
              &ldquo;{profile.summary}&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
