import type { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { BookOpen, HelpCircle, Info, Mail, Shield } from "lucide-react";
import { ease } from "../../lib/motion";

const LINKS = [
  { to: "/about", label: "About", icon: Info },
  { to: "/guides", label: "Guides", icon: BookOpen },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/contact", label: "Contact", icon: Mail },
  { to: "/privacy-policy", label: "Privacy", icon: Shield },
];

/** Readable long-form layout shared by About, FAQ, Guides, Contact and policies. */
export function ContentLayout({
  eyebrow,
  title,
  intro,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-12 md:px-6">
      <div className="mx-auto max-w-3xl">
        <motion.header
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="mb-10"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8c866]"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.out } },
            }}
            className="font-display text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl"
          >
            {title}
          </motion.h1>
          {intro && (
            <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {intro}
            </motion.p>
          )}
          {meta && (
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-3 text-sm text-muted-foreground">
              {meta}
            </motion.div>
          )}
        </motion.header>

        <article className="space-y-10 text-[17px] leading-[1.8] text-foreground/85">{children}</article>

        <nav aria-label="Site information" className="mt-16 flex flex-wrap gap-2 border-t border-white/[0.06] pt-8">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[#d4a843]/40 hover:text-[#e8c866]"
            >
              <l.icon className="h-3.5 w-3.5" aria-hidden="true" /> {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function ContentSection({ heading, paragraphs }: { heading: string; paragraphs: string[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: ease.out }}
    >
      <h2 className="mb-3 font-display text-2xl font-bold text-foreground">{heading}</h2>
      <div className="space-y-4">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </div>
    </motion.section>
  );
}
