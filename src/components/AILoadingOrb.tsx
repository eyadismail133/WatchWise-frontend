import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const loadingTexts = [
  "Analyzing your taste profile...",
  "Scanning the global catalog...",
  "Matching mood patterns...",
  "Discovering hidden gems...",
  "Calculating perfect matches...",
  "Curating your recommendations...",
];

export function AILoadingOrb() {
  const [currentText, setCurrentText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center">
      {/* Animated Orb */}
      <div className="relative w-48 h-48">
        {/* Outer rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-[#d4a843]/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Gradient orb */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(212,168,67,0.4), rgba(138,111,191,0.3), rgba(10,10,15,0.8))",
          }}
          animate={{
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 70% 70%, rgba(138,111,191,0.3), transparent 70%)",
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4a843] to-[#8a6fbf]"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              boxShadow: "0 0 40px rgba(212,168,67,0.5), 0 0 80px rgba(138,111,191,0.3)",
            }}
          />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#d4a843]"
            style={{
              left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6)}%`,
              top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6)}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Loading Text */}
      <div className="mt-12 h-8 flex items-center justify-center">
        <motion.p
          key={currentText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-lg text-muted-foreground font-medium"
        >
          {loadingTexts[currentText]}
        </motion.p>
      </div>

      {/* Subtitle */}
      <p className="mt-2 text-sm text-muted-foreground/60">
        WatchWise AI is finding your perfect watch
      </p>
    </div>
  );
}
