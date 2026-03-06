"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginWithBackend } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export const LoginForm = () => {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && !email.trim() ? "Email is required" : null;
  const passwordError = touched.password && !password ? "Password is required" : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);

    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      const authUser = await loginWithBackend({ email: email.trim(), password });
      setUser(authUser);
      toast.success(`Welcome back, ${authUser.name.split(" ")[0]}!`);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Check your credentials.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-label="Sign in form">
      {/* Global error banner */}
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Email address
        </label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError(null);
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@newellhomes.com"
          autoComplete="email"
          disabled={loading}
          required
          aria-label="Email address"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
          className={cn(
            "h-11 text-sm transition-colors",
            emailError && "border-destructive ring-1 ring-destructive/30"
          )}
        />
        {emailError && (
          <p id="email-error" className="text-xs text-destructive" role="alert">
            {emailError}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Password
          </label>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="••••••••••"
            autoComplete="current-password"
            disabled={loading}
            required
            aria-label="Password"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={cn(
              "h-11 pr-11 text-sm transition-colors",
              passwordError && "border-destructive ring-1 ring-destructive/30"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="text-xs text-destructive" role="alert">
            {passwordError}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="mt-1 h-11 w-full text-sm font-semibold"
        aria-label="Sign in"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
};
