import { LayoutGroup, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { spring } from "../../lib/motion";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<NoInfer<T>>[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  id: string;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/** Pill tabs whose active background glides between options (shared layoutId). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
  label,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <LayoutGroup id={id}>
      <div
        role="tablist"
        aria-label={label}
        className={`scrollbar-hide relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur ${className}`}
      >
        {options.map((option) => {
          const active = option.value === value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={`relative isolate flex flex-shrink-0 items-center gap-1.5 rounded-full font-medium transition-colors ${
                size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              } ${active ? "text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {active && (
                <motion.span
                  layoutId="segment-pill"
                  transition={spring.layout}
                  className="absolute inset-0 -z-10 rounded-full bg-[#d4a843] shadow-[0_0_24px_rgba(212,168,67,0.35)]"
                />
              )}
              {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
              <span className="whitespace-nowrap">{option.label}</span>
              {typeof option.count === "number" && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-[10px] ${
                    active ? "bg-black/20" : "bg-white/10"
                  }`}
                >
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
