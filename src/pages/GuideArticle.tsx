import { Link, useParams } from "react-router";
import { Clock } from "lucide-react";
import site from "../content/site.json";
import { ContentLayout, ContentSection } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";
import NotFound from "./NotFound";

export default function GuideArticle() {
  const { slug } = useParams<{ slug: string }>();
  const guide = site.guides.find((g) => g.slug === slug);
  usePageMeta(guide?.title ?? "Guide not found", guide?.description);
  if (!guide) return <NotFound />;
  const others = site.guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <ContentLayout
      eyebrow="Guide"
      title={guide.title}
      intro={guide.description}
      meta={
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {guide.minutes} min read · By the WatchWise team
        </span>
      }
    >
      {guide.sections.map((s) => (
        <ContentSection key={s.heading} heading={s.heading} paragraphs={s.paragraphs} />
      ))}
      <aside className="rounded-2xl border border-white/[0.07] bg-card/50 p-6">
        <h2 className="mb-3 font-display text-lg font-bold">Keep reading</h2>
        <ul className="space-y-2 text-base">
          {others.map((o) => (
            <li key={o.slug}>
              <Link to={`/guides/${o.slug}`} className="text-[#d4a843] hover:text-[#e8c866]">
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </ContentLayout>
  );
}
