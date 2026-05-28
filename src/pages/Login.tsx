import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authClient } from "../lib/auth-client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: (name || email.split("@")[0] || "User").trim(),
        });
        if (error) {
          toast.error(error.message ?? "Sign up failed");
          return;
        }
        if (!data?.user) {
          toast.error("Could not create account. Please try again.");
          return;
        }
        toast.success("Account created — welcome to WatchWise!");
      } else {
        const { data, error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error(error.message ?? "Sign in failed");
          return;
        }
        if (!data?.user) {
          toast.error("Invalid email or password");
          return;
        }
        toast.success("Signed in successfully");
      }
      await authClient.getSession();
      navigate("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-[#d4a843]" />
            <span className="font-display text-2xl font-bold">WatchWise</span>
          </Link>
          <h1 className="font-display text-xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin"
              ? "Sign in to save watchlists, favorites, and taste profile."
              : "Join WatchWise for personalized movie discovery."}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#d4a843] hover:bg-[#e8c866] text-background"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="text-[#d4a843] hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#d4a843] hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
