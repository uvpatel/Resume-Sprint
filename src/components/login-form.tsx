"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GitHubSignInButton } from "@/components/auth/sign-in-button";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (!urlError) return null;
    if (urlError === "internal_server_error") {
      return "An unexpected error occurred during authentication. Please try again.";
    }
    if (urlError === "access_denied") {
      return "Access was denied by GitHub. Please authorize ResumeSprint to continue.";
    }
    return `Authentication notice: ${urlError}`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign in");
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1.5 text-center mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2996F3] text-white font-mono text-base font-bold shadow-sm mb-2">
            RS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252525]">
            Welcome to ResumeSprint
          </h1>
          <p className="text-sm text-[#626262]">
            Sign in with GitHub or your email to access your resume workspace.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {/* Primary Social Provider: GitHub */}
        <Field>
          <GitHubSignInButton
            callbackUrl={callbackUrl}
            variant="primary"
            label="Continue with GitHub"
          />
        </Field>

        <FieldSeparator>Or continue with email</FieldSeparator>

        <Field>
          <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#252525]">
            Email Address
          </FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="border-[#E8E8E8] focus:border-[#2996F3]"
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2996F3] hover:bg-[#147DD8] text-white font-semibold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              "Sign In with Email"
            )}
          </Button>
        </Field>

        <FieldDescription className="text-center text-xs text-[#626262]">
          By continuing, you agree to ResumeSprint&apos;s{" "}
          <a href="/terms" className="underline hover:text-[#252525]">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-[#252525]">
            Privacy Policy
          </a>
          .
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
