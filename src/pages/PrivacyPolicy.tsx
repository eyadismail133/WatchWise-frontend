import { Link } from "react-router";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          WatchWise respects your privacy. This policy explains how we collect,
          use, and protect the information you share when using our website.
        </p>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly, such as account details
            and preferences. We also collect usage and device information
            automatically to improve the experience.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">
            Ads and Third-Party Services
          </h2>
          <p className="text-muted-foreground">
            WatchWise uses Google AdSense to display ads. Google may collect
            device and browser information, including cookies, in accordance
            with its own policies. By using this site, you agree that Google may
            use data as described in their privacy policy.
          </p>
          <p className="text-muted-foreground">
            For more details, please review Google’s privacy policy directly on
            the Google website.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">How We Use Information</h2>
          <p className="text-muted-foreground">
            We use collected information to operate and improve our service,
            personalize content, and keep the site secure.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Your Choices</h2>
          <p className="text-muted-foreground">
            You can update your account information in your profile settings.
            You may also control cookies and tracking through your browser
            settings.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this policy, please contact us through
            the website.
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
