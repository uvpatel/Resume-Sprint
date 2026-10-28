"use client";

import Link from "next/link";
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1.5 text-center mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2996F3] to-[#147DD8] text-white font-mono text-base font-bold shadow-sm shadow-blue-500/20 mb-2">
            RS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252525]">
            Create your account
          </h1>
          <p className="text-sm text-[#626262]">
            Start optimizing your resume with evidence-based intelligence.
          </p>
        </div>

        {/* Primary Social Provider: GitHub */}
        <Field>
          <GitHubSignInButton
            callbackUrl="/dashboard"
            variant="primary"
            label="Continue with GitHub"
          />
        </Field>

        <FieldSeparator>Or create with email</FieldSeparator>

        <Field>
          <FieldLabel htmlFor="name" className="text-xs font-semibold text-[#252525]">
            Full Name
          </FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Alex Morgan"
            required
            className="border-[#E8E8E8] bg-white focus:border-[#2996F3]"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#252525]">
            Email Address
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            className="border-[#E8E8E8] bg-white focus:border-[#2996F3]"
          />
          <FieldDescription className="text-xs text-[#9CA3AF]">
            We will never share your personal data or resume contents.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="text-xs font-semibold text-[#252525]">
            Password
          </FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            required
            className="border-[#E8E8E8] bg-white focus:border-[#2996F3]"
          />
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full bg-[#2996F3] hover:bg-[#147DD8] text-white font-semibold"
          >
            Create Account
          </Button>
          <FieldDescription className="px-6 text-center text-xs text-[#626262] mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2996F3] font-semibold hover:underline">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
