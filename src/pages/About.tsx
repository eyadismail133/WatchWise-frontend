import site from "../content/site.json";
import { ContentLayout, ContentSection } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";

export default function About() {
  usePageMeta(site.about.title, site.about.description);
  return (
    <ContentLayout eyebrow="About" title={site.about.title} intro={site.about.description}>
      {site.about.sections.map((s) => (
        <ContentSection key={s.heading} heading={s.heading} paragraphs={s.paragraphs} />
      ))}
    </ContentLayout>
  );
}
