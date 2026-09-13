"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/google-icon";
import { signIn } from "@/lib/auth-client";


const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter both email and password.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter both email and password."),
});


export function SignIn() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    await signIn.email(
      {
        email,
        password,
        rememberMe,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          setLoading(false);
        },
        onError: (ctx) => {
          setLoading(false);
          setError(ctx.error.message ?? "Unable to sign in. Please try again.");
        },
      },
    );
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-40 size-[28rem] rounded-full bg-violet-500/10 blur-[120px]"
      />

      <Card className="relative z-10 w-full max-w-sm rounded-3xl border-border/60 bg-card/70 shadow-2xl backdrop-blur-xl">
        <CardHeader className="px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to continue to your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  disabled={loading}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="signin-password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  disabled={loading}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-9 pl-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm font-normal text-muted-foreground"
              >
                Remember me
              </Label>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/sign-up"
              className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              Sign up, it&apos;s free!
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignIn;