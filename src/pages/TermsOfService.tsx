import { Link } from "react-router";

export default function TermsOfService() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">
          These Terms of Service govern your use of WatchWise. By using our
          website, you agree to these terms.
        </p>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Use of WatchWise</h2>
          <p className="text-muted-foreground">
            WatchWise is provided for personal, non-commercial use. You may
            browse, search, and use the site features in accordance with these
            terms.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">User Accounts</h2>
          <p className="text-muted-foreground">
            If you create an account, you are responsible for keeping your login
            details secure and for all activity under your account.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Content and Conduct</h2>
          <p className="text-muted-foreground">
            You agree not to post unlawful or abusive content. We may remove
            content or suspend accounts that violate these terms.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">
            Ads and Third-Party Services
          </h2>
          <p className="text-muted-foreground">
            WatchWise may display ads via Google AdSense. Third-party providers
            may collect data and show ads based on your activity.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Changes to These Terms</h2>
          <p className="text-muted-foreground">
            We may update these terms as needed. Continued use of the site after
            changes means you accept the updated terms.
          </p>
        </section>
        <div>
          <Link to="/" className="text-[#d4a843] hover:underline">
            ← Back to WatchWise
          </Link>
        </div>
      </div>
    </div>
  );
}
