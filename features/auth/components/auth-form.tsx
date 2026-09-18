"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { signIn, signUp } from "@/lib/auth-client";

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(1, "Enter your full name."),
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Use no more than 128 characters."),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function PasswordInput({ id, label, disabled, isNew, error }: {
  id: string;
  label: string;
  disabled: boolean;
  isNew: boolean;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input id={id} name={id} type={visible ? "text" : "password"}
          autoComplete={isNew ? "new-password" : "current-password"}
          disabled={disabled} required aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : isNew && id === "password" ? "password-hint" : undefined}
          className="h-10 pr-11" />
        <Button type="button" variant="ghost" size="icon" disabled={disabled}
          className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      {isNew && id === "password" && <FieldDescription id="password-hint">Use at least 8 characters.</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const requestInProgress = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(true);
  const disabled = pending !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInProgress.current) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const result = (isSignUp ? registrationSchema : credentialsSchema).safeParse(values);
    setError(null);
    setFieldErrors({});
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      (form.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement | null)?.focus();
      return;
    }
    requestInProgress.current = true;
    setPending("email");
    try {
      const credentials = { email: result.data.email, password: result.data.password };
      const response = isSignUp
        ? await signUp.email({ ...credentials, name: String(values.name).trim(), callbackURL: "/dashboard" })
        : await signIn.email({ ...credentials, rememberMe });
      if (response.error) {
        setError(response.error.message || "Unable to continue. Please try again.");
      } else {
        // Refresh server components after Better Auth issues the session cookie.
        router.replace("/dashboard");
        router.refresh();
        return;
      }
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    }
    requestInProgress.current = false;
    setPending(null);
  }

  async function handleGoogleSignIn() {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setPending("google");
    setError(null);
    setFieldErrors({});
    try {
      const response = await signIn.social({ provider: "google", callbackURL: "/dashboard" });
      if (response.error) {
        setError(response.error.message || "Unable to continue with Google. Please try again.");
      } else if (response.data?.url) {
        return;
      } else {
        setError("Unable to start Google sign-in. Please try again.");
      }
    } catch {
      setError("Unable to connect to Google. Please try again.");
    }
    requestInProgress.current = false;
    setPending(null);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md shadow-sm [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
        <CardHeader className="gap-2 text-center">
          <CardTitle><h1 className="text-2xl font-semibold tracking-tight">{isSignUp ? "Create an account" : "Welcome back"}</h1></CardTitle>
          <CardDescription>{isSignUp ? "Enter your details to get started." : "Sign in to access your dashboard."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button type="button" variant="outline" className="h-10 w-full" disabled={disabled} onClick={handleGoogleSignIn}>
            {pending === "google" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GoogleIcon className="size-4" />}
            {pending === "google" ? "Connecting to Google..." : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3" aria-hidden="true">
            <Separator className="flex-1" /><span className="text-xs text-muted-foreground">or continue with email</span><Separator className="flex-1" />
          </div>
          <form onSubmit={handleSubmit} noValidate aria-busy={disabled}>
            <FieldGroup className="gap-5">
              {isSignUp && <Field data-invalid={!!fieldErrors.name}>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" name="name" autoComplete="name" placeholder="Alex Morgan" required disabled={disabled} className="h-10" aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-error" : undefined} />
                {fieldErrors.name && <FieldError id="name-error">{fieldErrors.name}</FieldError>}
              </Field>}
              <Field data-invalid={!!fieldErrors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={disabled} className="h-10" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
                {fieldErrors.email && <FieldError id="email-error">{fieldErrors.email}</FieldError>}
              </Field>
              <PasswordInput id="password" label="Password" disabled={disabled} isNew={isSignUp} error={fieldErrors.password} />
              {isSignUp && <PasswordInput id="confirmPassword" label="Confirm password" disabled={disabled} isNew error={fieldErrors.confirmPassword} />}
              {!isSignUp && <Field orientation="horizontal">
                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} disabled={disabled} />
                <FieldLabel htmlFor="remember-me" className="font-normal">Remember me</FieldLabel>
              </Field>}
              {error && <FieldError className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">{error}</FieldError>}
              <Button type="submit" disabled={disabled} className="h-10 w-full">
                {pending === "email" && <Loader2 className="animate-spin" aria-hidden="true" />}
                {pending === "email" ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create account" : "Sign in")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-center text-sm text-muted-foreground">
          <p>{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

