import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { ease } from "../lib/motion";

export interface LightboxImage {
  url: string;
  thumb: string;
  width: number;
  height: number;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  label?: string;
}

const slideVariants = {
  enter: (d: number) => ({ x: d * 120, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d * -120, opacity: 0, scale: 0.96 }),
};

/** Swipeable, keyboard-driven image viewer with directional slide transitions. */
export function Lightbox({ images, index, onClose, label = "Image gallery" }: LightboxProps) {
  const [[current, direction], setState] = useState<[number, number]>([index ?? 0, 0]);
  const [lastIndex, setLastIndex] = useState<number | null>(index);

  if (index !== lastIndex) {
    setLastIndex(index);
    if (index !== null) setState([index, 0]);
  }

  const open = index !== null && images.length > 0;
  const paginate = useCallback(
    (dir: number) =>
      setState(([c]) => [(c + dir + images.length) % images.length, dir]),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, paginate]);

  if (typeof document === "undefined") return null;
  const img = images[current];

  return createPortal(
    <AnimatePresence>
      {open && img && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between p-3 text-sm text-white/70">
            <span className="tabular-nums">
              {current + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Open full resolution image"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                autoFocus
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white hover:text-black"
                aria-label="Close gallery"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-16">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={img.url}
                src={img.url}
                alt=""
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: ease.out }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) paginate(1);
                  else if (info.offset.x > 80) paginate(-1);
                }}
                className="max-h-[78vh] max-w-full cursor-grab rounded-lg object-contain shadow-2xl active:cursor-grabbing"
                style={{ aspectRatio: `${img.width} / ${img.height}` }}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => paginate(-1)}
                  className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:flex"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => paginate(1)}
                  className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:flex"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto p-3">
            {images.map((im, i) => (
              <button
                key={im.url}
                type="button"
                onClick={() => setState([i, i > current ? 1 : -1])}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === current}
                className={`relative h-14 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                  i === current ? "opacity-100 ring-2 ring-[#d4a843]" : "opacity-50 hover:opacity-90"
                }`}
                style={{ aspectRatio: `${im.width} / ${im.height}` }}
              >
                <img src={im.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
