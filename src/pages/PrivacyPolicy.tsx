import site from "../content/site.json";
import { ContentLayout, ContentSection } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";

export default function PrivacyPolicy() {
  usePageMeta(site.privacy.title, site.privacy.description);
  return (
    <ContentLayout
      eyebrow="Legal"
      title={site.privacy.title}
      intro={site.privacy.description}
      meta={<>Last updated {site.privacy.updated}</>}
    >
      {site.privacy.sections.map((s) => (
        <ContentSection key={s.heading} heading={s.heading} paragraphs={s.paragraphs} />
      ))}
    </ContentLayout>
  );
}
