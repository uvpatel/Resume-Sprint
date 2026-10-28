"use client"

import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-white text-[#252525]">
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-between">
        <div className="flex justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-[#252525]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2996F3] to-[#147DD8] shadow-sm shadow-blue-500/20 text-white font-mono text-xs font-black">
              RS
            </div>
            <span className="text-lg">
              Resume<span className="font-semibold">Sprint</span>
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-[#626262]">Loading sign in form...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <div className="text-center md:text-left text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} ResumeSprint. Evidence-based resume optimization.
        </div>
      </div>
      <div className="relative hidden bg-[#F8FAFC] border-l border-[#E8E8E8] lg:block">
        <Image
          src="/login/resume.png"
          alt="ResumeSprint workspace illustration"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}
