import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeSprint — Smarter AI Resume Optimization",
  description:
    "Match your resume to a job description, review evidence-based improvements, and optimize your application while staying in control of every change.",
  keywords: [
    "resume optimization",
    "AI resume scanner",
    "ATS resume checker",
    "job matching",
    "career",
    "ResumeSprint",
  ],
  authors: [{ name: "ResumeSprint" }],
  openGraph: {
    title: "ResumeSprint — Smarter AI Resume Optimization",
    description:
      "Match your resume to a job description, review evidence-based improvements, and optimize your application while staying in control of every change.",
    siteName: "ResumeSprint",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeSprint — Smarter AI Resume Optimization",
    description:
      "Match your resume to a job description, review evidence-based improvements, and optimize your application while staying in control of every change.",
  },
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-white text-[#252525] selection:bg-[#EAF4FF] selection:text-[#147DD8]"
      >
        {children}
      </body>
    </html>
  );
}
