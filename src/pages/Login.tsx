import { useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Link, useNavigate } from "react-router";
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authClient } from "../lib/auth-client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { PosterWall } from "../components/PosterWall";
import { ease, spring } from "../lib/motion";
import { uploadImageToCloudinary } from "../lib/cloudinary";

export default function Login() {
  const navigate = useNavigate();
  usePageMeta("Sign in", "Sign in or create a free WatchWise account to save a watchlist, rate titles and get AI recommendations.");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        let imageUrl = "";

        if (image) {
          imageUrl = await uploadImageToCloudinary(image);
        }

        const { data, error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: (name || email.split("@")[0] || "User").trim(),
          image: imageUrl,
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
    <div className="relative -mt-16 flex min-h-screen items-center justify-center overflow-hidden px-6 pb-12 pt-28">
      <PosterWall />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: ease.out }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <motion.span
              animate={{ rotate: [0, 12, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex"
            >
              <Sparkles className="w-8 h-8 text-[#d4a843]" />
            </motion.span>
            <span className="font-display text-2xl font-bold">WatchWise</span>
          </Link>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-display text-2xl font-bold"
            >
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </motion.h1>
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin"
              ? "Sign in to save watchlists, favorites, and taste profile."
              : "Join WatchWise for personalized movie discovery."}
          </p>
        </div>

        <motion.div
          layout
          transition={spring.layout}
          className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
        >
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  key="signup-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: ease.out }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-3">
                    <label htmlFor="profile-image" className="cursor-pointer">
                      <img
                        src={
                          preview ||
                          "https://ui-avatars.com/api/?name=User&background=1f2937&color=fff"
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#d4a843]"
                      />
                    </label>

                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        setImage(file);
                        setPreview(URL.createObjectURL(file));
                      }}
                    />

                    <p className="text-xs text-muted-foreground">
                      Tap image to choose photo
                    </p>
                  </div>
                  <div className="relative">
                    {" "}
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />{" "}
                    <Input
                      placeholder="Name"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-label="Name"
                    />{" "}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                aria-label="Email"
                autoComplete="email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                aria-label="Password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
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
        </motion.div>
      </motion.div>
    </div>
  );
}
