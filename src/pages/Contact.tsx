import { Github, Mail, MessageSquare } from "lucide-react";
import { ContentLayout, ContentSection } from "../components/content/ContentLayout";
import { usePageMeta } from "../hooks/usePageMeta";

const email = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

export default function Contact() {
  usePageMeta("Contact", "Contact the WatchWise team about your account, privacy requests, incorrect information or partnerships.");
  return (
    <ContentLayout
      eyebrow="Contact"
      title="Get in touch"
      intro="Questions, feedback, a privacy request or a bug report — we read every message."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="group rounded-2xl border border-white/[0.07] bg-card/60 p-6 transition-colors hover:border-[#d4a843]/40"
          >
            <Mail className="mb-3 h-6 w-6 text-[#d4a843]" aria-hidden="true" />
            <div className="font-semibold group-hover:text-[#e8c866]">Email</div>
            <div className="text-base text-muted-foreground">{email}</div>
          </a>
        )}
        <a
          href="https://github.com/eyadismail133/WatchWise-frontend/issues"
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-white/[0.07] bg-card/60 p-6 transition-colors hover:border-[#d4a843]/40"
        >
          <Github className="mb-3 h-6 w-6 text-[#d4a843]" aria-hidden="true" />
          <div className="font-semibold group-hover:text-[#e8c866]">Report a bug</div>
          <div className="text-base text-muted-foreground">Open an issue on GitHub</div>
        </a>
      </div>
      <ContentSection
        heading="What to include"
        paragraphs={[
          "For account or privacy requests, write from the email address linked to your WatchWise account so we can verify it is you. Requests to export or delete your data are usually handled within 30 days.",
          "For wrong title details such as a cast list, release date or poster, the fastest fix is to edit the entry on The Movie Database (themoviedb.org); changes there appear on WatchWise automatically.",
        ]}
      />
      <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-card/40 p-5 text-base text-muted-foreground">
        <MessageSquare className="mt-1 h-5 w-5 flex-shrink-0 text-[#d4a843]" aria-hidden="true" />
        Signed-in users can also discuss any title in the comments on its page.
      </div>
    </ContentLayout>
  );
}
