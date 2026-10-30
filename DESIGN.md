# ResumeSprint Design System & UI/UX Specification (`DESIGN.md`)

> **Single Source of Truth** for the visual identity, token architecture, component behaviors, page layouts, and engineering standards across the **ResumeSprint** platform.
> Document Status: Production-Ready • Version: 2.0.0 (Dashboard Redesign Specification) • Framework: Next.js 16 + Tailwind CSS v4 + Radix/Base-UI

---

## 1. Design System Overview

**ResumeSprint** is an evidence-grounded resume optimization and diagnostic platform. Unlike generative AI tools that hallucinate candidate credentials or rewrite resumes with generic buzzwords, ResumeSprint operates on **deterministic evaluation (Rubric v1)**, **100% fact preservation**, and **granular user governance** (accept/edit/reject/undo).

The user experience bridges two distinct product surfaces:
1. **The Marketing & Editorial Surface** (`/`, `/login`, `/signup`, `/privacy`, `/terms`): Clean, trustworthy, generous with whitespace, high legibility, professional editorial typography, and structured content sections.
2. **The High-Density Application Surface** (`/dashboard`, `/dashboard/new`, `/dashboard/resumes`, `/dashboard/resumes/[id]`, `/dashboard/resumes/[id]/scan`, `/dashboard/resumes/[id]/optimize`, `/dashboard/history`, `/dashboard/settings`): High-utility, responsive workspace with KPI telemetry, data tables, diff inspection, progress gauges, and real-time rubric breakdowns in light and dark modes.

### Key Technology Stack
- **Framework**: Next.js 16 (Turbopack, App Router, React 19)
- **Styling Architecture**: Tailwind CSS v4 (`@import "tailwindcss"`, CSS variables, `@theme inline`, OKLCH tokens)
- **Component Primitives**: Radix UI / `@base-ui/react` primitives (Dropdowns, Dialogs, Tooltips, Menus)
- **Icons**: `lucide-react` (standard 16px–20px sizing with 1.75–2.2 stroke weight)
- **Visualizations**: `recharts` and custom inline SVGs for sparklines, radial score gauges, and diff highlights
- **Typography**: `next/font/google` with `Geist` (Sans-serif) and `Geist Mono` (Monospaced metrics, hashes, tabular telemetry)

---

## 2. Brand Identity and Visual Direction: Minimal Editorial SaaS Workspace

The redesigned application surface establishes a visual language called the **Minimal Editorial SaaS Workspace**.

The dashboard combines:
- **The Clarity of Linear**: Focused view, high signal-to-noise ratio, subtle borders instead of nested cards, keyboard-friendly navigation, and clear typographic hierarchy.
- **The Information Hierarchy of Stripe**: Compact, trustworthy telemetry cards, tabular numerals, muted supporting labels, and clear status indicators.
- **The Restrained Visual Design of Vercel**: Clean monochrome canvas, restrained monochrome borders, crisp typography, and purposeful single-color interactive accents.
- **ResumeSprint's Unique Identity**: Verification-first indicators, cryptographic hashes, deterministic rubric scores, authentic multi-format badges (PDF/DOCX/TXT), and 100% fact preservation guarantees.

### Core Design Principles

1. **Content over decoration**: Remove unnecessary visual flair, ungrounded badges, and marketing-style banners from application workspaces.
2. **Whitespace over containers**: Group related data with spacing and alignment rather than wrapping every single element in an elevated card with heavy borders.
3. **Hierarchy over density**: Make the primary task (inspecting, scanning, or optimizing a resume) immediately obvious without competing secondary widgets.
4. **Function over novelty**: Every component, button, and indicator must serve a verified user action. No decorative graphs without real underlying data.
5. **Consistency over variation**: Apply identical spacing, radius, typography, and state rules across all 8 dashboard routes.
6. **Evidence over visual exaggeration**: Resume scores and analysis results must reflect real calculations from the deterministic scoring engine. Never fabricate trends or activity metrics.
7. **Progressive disclosure**: Present the primary status and high-level score first; reveal deep rubric dimensions, source fact provenance, and AST word diffs upon interaction.

---

## 3. Existing Design Audit

### Established Strengths
1. **Strict Content Preservation**: Zero tolerance for hallucinated claims. The workspace clearly visualizes exact before-and-after differences with granular decision buttons (`accept`, `edit`, `reject`, `undo`).
2. **Reliable Multi-Format Parsing**: Verified native text extraction for PDF, DOCX, and TXT with sandbox boundaries and magic-byte checks.
3. **Robust Backend Infrastructure**: Session management, background scoring jobs, monotonic version increments, and durable event logs.
4. **Dual-Theme Foundation**: Semantic variables in `globals.css` that support both light and dark modes.

### Real Friction Points in Current Dashboard Implementation

| Screen / Area | Identified Issue in Codebase | Recommended Solution |
| :--- | :--- | :--- |
| **`/dashboard` Hero Banner** | Oversized promotional banner (`rounded-3xl` gradient with floating decorative resume illustration) occupies ~400px of vertical height, pushing the user's actual resumes and recent analyses below the fold. | Replace with a compact, focused page header (`h1` + 1-sentence description + single `Upload Resume` button). |
| **`/dashboard` KPI Statistics** | Decorative SVG waves in cards are hardcoded visuals rather than actual historical trends; metric values contain mock data (`12`, `11`, `92%`) when user database records are empty. | Render genuine telemetry derived from `getResumesByUserId` and `getScansByUserId`. Use sparklines only when at least 2 real historical evaluations exist; otherwise show a clean stat with contextual subtitle. |
| **Nested Containers & Cards** | Analysis overview, format badges, and activity timelines are each wrapped in separate heavy card borders, creating a fragmented "boxed-in" feeling. | Consolidate the main page flow into an open canvas with an authoritative data table as the primary focal point. |
| **Sidebar Navigation Items** | Navigation includes an embedded marketing promo card ("Get better results with AI-powered insights") inside the app sidebar, taking up vertical utility space. | Remove promotional banners from the active workflow sidebar. Keep sidebar strictly functional: brand wordmark, core navigation links, and candidate profile. |
| **Route Styling Inconsistencies** | `/dashboard/resumes`, `/dashboard/settings`, and `/dashboard/history` use dark-mode hardcoded classes (`text-white`, `border-zinc-800`, `bg-zinc-900`) while `/dashboard` uses mixed light/dark classes (`bg-white dark:bg-zinc-900`). | Standardize all dashboard routes to semantic Tailwind tokens (`bg-card`, `text-foreground`, `border-border`, `bg-background`). |
| **Overuse of Badges** | Multiple redundant badges appear simultaneously (e.g., "100% PARSED", "CANONICAL", "PRO", "VALIDATED"). | Use a single subtle status badge per item only when required to communicate state. |

---

## 4. Dashboard UX and Visual Hierarchy

### 4.1 Application Shell Architecture

```
+------------------------------------------------------------------------------------+
|  [Logo] ResumeSprint       | Search resumes, analyses...       [Theme] [Bell] [User] |  <-- Top Header (h-14)
+----------------------------+-------------------------------------------------------+
|  Dashboard                 | Dashboard Overview                                    |  <-- Compact Page Header
|  Upload Resume             | Track your resumes, evaluate job match, and optimize.  |
|  My Analyses               | [ + Upload Resume ]                                   |
|  History                   +-------------------------------------------------------+
|  Settings                  | [KPI: Total]   [KPI: Analyzed]  [KPI: Avg]  [KPI: Pres.]|  <-- Compact Stat Grid
|                            +-------------------------------------------------------+
|                            | Your Resumes (Primary Workspace Table)                |  <-- Main Focal Point
|                            | ----------------------------------------------------- |
|                            | Filename       Format   Updated     Score    Actions  |
|                            | resume_v1.pdf   PDF     2 hrs ago    89%     [View]   |
|                            +-------------------------------------------------------+
|  [Avatar] Candidate Name   | Key Rubric Insights (Secondary Grid)                  |
|  candidate@email.com       | [Skills 92%]  [Exp 87%]  [Edu 78%]  [ATS 85%]         |
+------------------------------------------------------------------------------------+
```

### 4.2 Section Hierarchy & Priorities

1. **Top Header**: Subtle utility bar (`h-14` / 56px). Contains sidebar toggle, workspace breadcrumbs/search, light/dark mode switch, unread notification counter, and user profile menu.
2. **Page Introduction**: Compact header (no gradients, no illustrations). Single H1 (`text-2xl font-bold tracking-tight text-foreground`), one supporting sentence (`text-sm text-muted-foreground`), and the primary call-to-action button (`Upload Resume`).
3. **KPI Statistics Grid**: 4 equal-width telemetry cards. Flat, clean, tabular numbers with subtle semantic indicators.
4. **Primary Resume Workspace**: The central focus of `/dashboard`. A clean, responsive data table presenting authentic resumes from the database with direct links to view, scan, or optimize.
5. **Secondary Analysis Insights**: Positioned below the primary table. Displays the canonical 5-category Rubric v1 breakdown (`Keywords & Skills 40%`, `Role Alignment 20%`, `Quantified Impact 20%`, `Experience Depth 10%`, `ATS Readability 10%`).
6. **Supporting Meta**: Compact format capabilities and authentic activity timestamps.

---

## 5. Refined Design Tokens

All colors retain the existing ResumeSprint identity while using semantic CSS variables to guarantee flawless light and dark mode presentation.

### 5.1 Palette Tokens

| Semantic Token | Light Mode Value | Dark Mode Value | Usage Rule |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0 0)` (`#F8FAFC`) | `oklch(0.12 0 0)` (`#09090B`) | Base application canvas |
| `--foreground` | `oklch(0.24 0 0)` (`#1E293B`) | `oklch(0.95 0 0)` (`#F8FAFC`) | Primary typography |
| `--card` | `oklch(1.00 0 0)` (`#FFFFFF`) | `oklch(0.15 0 0)` (`#131418`) | Elevated surfaces, tables, cards |
| `--card-foreground` | `oklch(0.24 0 0)` (`#1E293B`) | `oklch(0.95 0 0)` (`#F8FAFC`) | Typography inside cards |
| `--muted` | `oklch(0.96 0 0)` (`#F1F5F9`) | `oklch(0.18 0 0)` (`#1E1F24`) | Table headers, chip backgrounds |
| `--muted-foreground` | `oklch(0.50 0 0)` (`#64748B`) | `oklch(0.65 0 0)` (`#94A3B8`) | Subtitles, timestamps, metadata |
| `--border` | `oklch(0.92 0 0)` (`#E2E8F0`) | `oklch(0.22 0 0)` (`#222328`) | Dividers, card boundaries |
| `--primary` | `oklch(0.51 0.23 277.2)` (`#4F46E5`) | `oklch(0.65 0.20 277.0)` (`#6366F1`)| Primary interactive buttons |
| `--primary-foreground`| `oklch(1.00 0 0)` (`#FFFFFF`) | `oklch(0.12 0 0)` (`#09090B`) | Text on primary buttons |
| `--success` | `#10B981` | `#34D399` | Match score ≥ 80%, completed status |
| `--warning` | `#F59E0B` | `#FBBF24` | Match score 60–79%, pending review |
| `--danger` | `#EF4444` | `#F87171` | Match score < 60%, failed analysis |

### 5.2 Document Format Palette

| Format | Color | Token Class | Usage |
| :--- | :--- | :--- | :--- |
| **PDF** | `#EA4335` | `bg-red-500/10 text-red-600 border-red-500/20` | Native PDF documents |
| **DOCX** | `#2B579A` | `bg-blue-500/10 text-blue-600 border-blue-500/20` | Structured Microsoft Word files |
| **TXT** | `#475569` | `bg-slate-500/10 text-slate-600 border-slate-500/20` | UTF-8 plain text documents |

---

## 6. Typography System

The interface uses **Geist Sans** for UI hierarchy and **Geist Mono** for telemetry, versions, and SHA-256 hashes.

### 6.1 Dashboard Type Scale

| Level | Desktop Size / Leading | Mobile Size / Leading | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page H1** | `1.75rem` (28px) / `2.25rem` | `1.5rem` (24px) / `2rem` | `font-bold` (700) | Dashboard view headers |
| **Section H2**| `1.125rem` (18px) / `1.75rem` | `1.125rem` (18px) / `1.75rem`| `font-semibold` (600) | Card groups, table headers |
| **Subheading**| `0.875rem` (14px) / `1.25rem` | `0.875rem` (14px) / `1.25rem`| `font-normal` (400) | Descriptive subtitles |
| **Body / Table**| `0.8125rem` (13px) / `1.25rem`| `0.8125rem` (13px) / `1.25rem`| `font-medium` (500) | Table rows, list items |
| **Caption** | `0.75rem` (12px) / `1rem` | `0.75rem` (12px) / `1rem` | `font-normal` (400) | Timestamps, file sizes |
| **Metric Value**| `1.75rem` (28px) / `1.0` | `1.5rem` (24px) / `1.0` | `font-bold font-mono` | Quantitative telemetry numbers |
| **Technical** | `0.6875rem` (11px) / `1.2` | `0.6875rem` (11px) / `1.2` | `font-mono` | Hashes, versions, file types |

---

## 7. Spacing System

Spacing strictly aligns to an 8-point base rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`).

| Token | Value | Tailwind Class | Application Rule |
| :--- | :--- | :--- | :--- |
| `micro` | 4px | `p-1`, `gap-1` | Spacing between icon and adjacent label |
| `compact` | 8px | `p-2`, `gap-2` | Control padding inside table rows and buttons |
| `element` | 12px | `p-3`, `gap-3` | Spacing between form fields and related sub-items |
| `component`| 16px | `p-4`, `gap-4` | Standard card internal padding, grid column gaps |
| `group` | 24px | `p-6`, `gap-6` | Major card padding, table outer padding |
| `section` | 32px | `space-y-8` | Separation between KPI grid, primary table, and insights |
| `boundary`| 40px | `py-10` | Top/bottom viewport clearance |

---

## 8. Layout and Grid System

- **Main Application Workspace**: `max-w-[1440px] mx-auto` with `px-4 sm:px-6 lg:px-8 py-6 sm:py-8`.
- **KPI Metrics Grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
- **Primary / Secondary Split**:
  - Full-width workspace table (`col-span-12`) for high-speed scanning and clear multi-column readability.
  - 2-column secondary analytical split (`grid grid-cols-1 lg:grid-cols-12 gap-6`):
    - Left (8 cols): Rubric breakdown and keyword evidence chips.
    - Right (4 cols): Format capabilities and authentic activity events.

---

## 9. Responsive Breakpoints

| Viewport | Width | Dashboard Adaptation |
| :--- | :--- | :--- |
| **Mobile** | `< 640px` | Sidebar collapses to off-canvas drawer; KPI grid collapses to 1 column; table columns prioritize Filename + Score with secondary columns stacked; page action button spans full width. |
| **Tablet** | `640px – 1023px`| KPI grid expands to 2 columns; top search bar remains visible; table displays Filename, Format, Score, and Actions. |
| **Desktop** | `1024px – 1439px`| Persistent 240px sidebar; 4-column KPI grid; full table with all 5 columns; 8+4 secondary split. |
| **Wide** | `≥ 1440px` | Maximum content boundaries lock at 1440px with balanced margins to prevent text lines from over-stretching. |

---

## 10. Border, Radius, and Shadow Tokens

### 10.1 Border Radii
- **Inputs & Small Controls**: `rounded-lg` (8px)
- **Buttons**: `rounded-lg` (8px) for secondary/ghost; `rounded-xl` (10px–12px) for primary actions
- **Cards, Tables & Modals**: `rounded-xl` (12px) or `rounded-2xl` (16px)
- **Status Indicators & Avatars**: `rounded-full` (9999px)

### 10.2 Shadows
- **Cards & Surfaces**: `shadow-xs` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`)
- **Hovered Items**: `shadow-sm` (`0 1px 3px 0 rgb(0 0 0 / 0.1)`)
- **Dropdowns & Popovers**: `shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / 0.1)`)

---

## 11. Component Design Standards

### 11.1 Top Header (`site-header.tsx`)
- **Height**: `h-14` (56px) sticky top (`sticky top-0 z-30`).
- **Surface**: `bg-background/80 backdrop-blur-md border-b border-border`.
- **Elements**:
  - Left: Sidebar trigger toggle + search input (`max-w-xs text-xs rounded-lg bg-muted/50 border border-border/60 pl-8 pr-3 py-1.5`).
  - Right: Theme toggle + Notification bell (badge shows only when genuine unread events exist) + UserMenu dropdown.

### 11.2 Left Sidebar (`app-sidebar.tsx`)
- **Width**: `w-60` (240px).
- **Surface**: `bg-sidebar border-r border-sidebar-border`.
- **Header**: Compact origami brand mark + `ResumeSprint` wordmark + minimal version tag (`v1.0`).
- **Navigation Links**:
  - `Dashboard` (`/dashboard`, icon: `LayoutDashboard`)
  - `Upload Resume` (`/dashboard/new`, icon: `Upload`)
  - `My Resumes` (`/dashboard/resumes`, icon: `FileText`)
  - `Analysis History` (`/dashboard/history`, icon: `History`)
  - `Settings` (`/dashboard/settings`, icon: `Settings`)
- **States**:
  - Default: `text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-lg px-3 py-2 text-xs font-medium`
  - Active: `bg-primary/10 text-primary font-semibold rounded-lg px-3 py-2 text-xs`
- **Footer**: Simplified user profile trigger showing initialed avatar, truncated candidate name, and user email.

### 11.3 Page Header
Compact and functional without marketing illustrations:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-foreground">
      Dashboard
    </h1>
    <p className="text-sm text-muted-foreground mt-0.5">
      Track your resumes, review analysis results, and improve your applications.
    </p>
  </div>
  <Link
    href="/dashboard/new"
    className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
  >
    <Upload className="h-3.5 w-3.5 stroke-[2.2]" />
    <span>Upload Resume</span>
  </Link>
</div>
```

### 11.4 KPI Statistics Card (`kpi-card.tsx`)
- Compact internal padding: `p-4 sm:p-5`.
- Header: Label in `text-xs font-medium text-muted-foreground` paired with a clean icon (`size-4 text-muted-foreground`).
- Metric: Prominent numerical value (`text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums`).
- Subtitle: Contextual description in `text-[11px] text-muted-foreground mt-1`.
- Trend: Displayed only when at least 2 real historical records exist; otherwise suppressed to prevent fake statistics.

### 11.5 Primary Resume Workspace Table
The core table on `/dashboard` and `/dashboard/resumes`:

| Column | Alignment | Type & Treatment | Example |
| :--- | :--- | :--- | :--- |
| **Resume** | Left | File icon (PDF/DOCX/TXT) + filename (`font-medium text-foreground hover:text-primary`) + file size caption | `john_doe_resume.pdf` • 2.4 MB |
| **Format** | Left | Minimal format pill (`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md`) | `PDF` |
| **Last Updated** | Left | Formatted relative timestamp (`text-xs text-muted-foreground font-mono`) | `Oct 28, 2026` |
| **Status / Score** | Left | Circular status dot + score percentage with semantic coloring | `● 89% Match` |
| **Actions** | Right | Action button group (`View Report`, `Optimize`, `More options`) | `[View] [···]` |

### 11.6 Rubric Score Breakdown (`rubric-breakdown.tsx`)
Presents the canonical Rubric v1 mathematical breakdown (Total = 100 points):
- **Keywords & Skill Match**: 40 points max (Direct evidence for core technical competencies)
- **Role Title Alignment**: 20 points max (Seniority progression and scope alignment)
- **Quantified Impact**: 20 points max (Concrete metrics, volume, percentages)
- **Experience Depth**: 10 points max (Chronological history and substantive responsibility)
- **ATS Readability & Layout**: 10 points max (Standard structures, clean headers, parseable layout)

Visual treatment: Thin horizontal progress tracks (`h-1.5 rounded-full bg-muted overflow-hidden`) with semantic fill bars.

### 11.7 Empty State (`empty-state.tsx`)
Deliberate, welcoming, and non-marketing:
- Centered icon in a muted circle (`w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground`).
- Concise heading (`text-base font-semibold text-foreground`): *"No resumes uploaded yet"*.
- One-sentence description (`text-xs text-muted-foreground max-w-sm`): *"Upload your resume in PDF, DOCX, or TXT format to evaluate keyword match and calculate rubric scores."*
- Action button: `Upload First Resume` (`/dashboard/new`).
- Subtle footnote: *"Max file size: 5MB • Validated against 100% preservation rules."*

### 11.8 Word Diff Inspector (`word-diff.tsx`)
- Removed text: Strikethrough on soft red tint (`bg-red-500/15 text-red-700 dark:text-red-400 line-through rounded-xs px-1`).
- Added / Proposed text: Bold on soft green tint (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium rounded-xs px-1`).
- Protected facts: Visual lock icon ensuring zero synthetic modifications to dates, companies, or degrees.

---

## 12. Navigation and Footer Standards

### 12.1 Desktop Navigation
- Top navigation stays slim and unobtrusive (`h-14`), focusing user attention on workbench content.
- Sidebar links utilize strict active route matching (`pathname === item.url` or `pathname.startsWith(item.url)`).

### 12.2 Mobile Navigation
- Accessible Sheet component triggered via menu button.
- Dismisses automatically upon link selection or `Escape` keypress.
- Disables body scroll when drawer is open.

---

## 13. Page Layout Patterns Across All Dashboard Routes

### 13.1 `/dashboard` (Overview)
1. Compact Page Header (Title + Description + Upload CTA).
2. KPI Telemetry Grid (Total Resumes, Completed Analyses, In Progress, Success Rate).
3. Primary Resume Workspace (Responsive Data Table of recent analyses).
4. Secondary Analytical Split: Rubric Overview + Supported Formats.

### 13.2 `/dashboard/new` (Intake & Upload)
1. Step Header: *"Upload & Analyze Resume"*.
2. Clean Dropzone: Drag-and-drop zone with format icons (PDF, DOCX, TXT) and 5MB sandbox validation.
3. Job Description Intake: Multiline textarea with prompt character count guidance.
4. Target Role Field: Auto-suggest or manual text input.
5. Primary Action: `Run Evidence Analysis` with active progress state during extraction.

### 13.3 `/dashboard/resumes` (Resume Inventory)
1. Inventory Header with upload shortcut.
2. Filter & Format Pills: Filter by PDF, DOCX, or TXT.
3. Complete Resumes Table: Full pagination, date sorting, and direct links to `/scan` and `/optimize`.

### 13.4 `/dashboard/resumes/[id]/scan` (Diagnostic Report)
1. Header: Target Role + Overall Match Score Ring (89%).
2. Primary Split:
   - Left (8 cols): Rubric v1 Breakdown + Verified Skills Chips + Missing Gaps List.
   - Right (4 cols): Job Description Criteria Summary + ATS Compatibility Assessment + `Optimize Resume` CTA.

### 13.5 `/dashboard/resumes/[id]/optimize` (Interactive Workspace)
1. Header: Monotonic Draft Version (`v1.0` → `v1.1`), Snapshot SHA-256 hash, and Export CTA.
2. Diff Workbench: Side-by-side or inline word diff of proposals with granular `Accept`, `Edit`, `Reject`, and `Undo` decision controls.
3. Preservation Badge: Live status indicator (`100% PRESERVED` or `FAILED`).

### 13.6 `/dashboard/history` (Historical Timeline)
1. Header with peak and average score summaries.
2. Chronological evaluation log showing date, target role, job criteria hash, and score delta.

### 13.7 `/dashboard/settings` (Settings & Rubric Config)
1. Profile details (Name, Email, Session ID).
2. Scoring rubric configuration (weights and thresholds).
3. Data privacy and retention controls (purge sessions, export data).

---

## 14. Forms and Interactive Elements

### 14.1 Form Controls
- **Inputs**: `h-9` (36px) or `h-10` (40px) on desktop; `h-11` (44px) on mobile for touch accessibility.
- **Borders**: Subtle border token `border-border focus:border-primary focus:ring-1 focus:ring-primary`.
- **Labels**: Clean `text-xs font-semibold text-foreground mb-1.5 block`.

### 14.2 Upload States
- **Idle**: Dashed border (`border border-dashed border-border hover:border-primary/60 bg-muted/20`).
- **Dragging**: `border-primary bg-primary/5 scale-[1.005] transition-all`.
- **Parsing**: Progress spinner with step status text (*"Extracting text spans...", "Verifying magic bytes...", "Calculating Rubric v1..."*).
- **Error**: High-visibility error callout with recovery advice (e.g., unsupported legacy Word `.doc` guidance).

---

## 15. Motion and Animation Guidelines

1. **Subtle Durations**: 150ms to 200ms with standard `ease-out` for all interactive transitions.
2. **State Meaning**: Motion is restricted to state transitions (dropdown reveal, accordion toggle, table row hover).
3. **Reduced Motion**: Strictly disabled via `@media (prefers-reduced-motion: reduce)` in `globals.css`.

---

## 16. Accessibility Standards (WCAG 2.1 AA)

- **Color Independence**: Status is never communicated by color alone. Every score and status combines a label, icon, and numerical value.
- **Contrast**: Text elements guarantee minimum 4.5:1 contrast against their respective canvas in both light and dark themes.
- **Keyboard Traversal**: Full tab stop order across the sidebar, header actions, table rows, and modal dialogs with visible `focus-visible:ring-2 focus-visible:ring-primary` indicators.
- **Screen Reader Support**: All icon-only buttons declare descriptive `aria-label` attributes; tables declare semantic `<th>` headers with `scope="col"`.

---

## 17. Technical Implementation Guidelines

### 17.1 Next.js 16 & React 19 Best Practices
- **Server Components**: Fetch data directly in server components (`getResumesByUserId`, `getScansByUserId`) without unnecessary client fetch cascades.
- **Client Boundaries**: Keep `"use client"` localized to interactive components (`SiteHeader`, `WordDiff`, `OptimizationWorkspace`).
- **Route Integrity**: Never break or modify established API routes or server actions.

### 17.2 Tailwind CSS v4 Compliance
- Use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-muted`) rather than hardcoded hex codes.
- Do not add arbitrary utility classes that break the 8-point rhythm.

---

## 18. Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** make the primary resume table the immediate visual focal point of `/dashboard`. | **Don't** push the user's data below the fold with oversized promotional hero banners. |
| **Do** display genuine data from the database with graceful empty states when empty. | **Don't** display hardcoded mock statistics or fake activity events in production views. |
| **Do** use compact, consistent padding (`p-4` to `p-6`) across all KPI and telemetry cards. | **Don't** use inconsistent card heights, arbitrary borders, or excessive nested containers. |
| **Do** use `.tabular-nums` on all metrics, scores, percentages, and timestamps. | **Don't** allow changing numerical values to cause layout shifts. |
| **Do** support both Light and Dark modes seamlessly using semantic design tokens. | **Don't** hardcode dark-mode classes (`text-white`, `bg-zinc-900`) directly into page templates. |

---

## 19. Design Consistency Checklist

Before shipping any dashboard updates, verify:

- [ ] Does the page use the standardized workspace container (`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`)?
- [ ] Is the page header compact (H1 + 1-sentence subtitle + primary action) without decorative banners?
- [ ] Are all KPI cards visually aligned with identical height, padding, and tabular typography?
- [ ] Does the table render responsively on mobile viewports (320px–420px) without horizontal page overflow?
- [ ] Are all status indicators accessible in both light and dark modes?
- [ ] Do all interactive controls have visible keyboard focus rings?
- [ ] Does the screen adhere to 100% content preservation principles with zero synthetic claims?

---

## 20. Future Design Improvements (Roadmap)

1. **Synchronized Split-Pane Diff View**: Side-by-side split screen linking original PDF spans directly to proposed patch paragraphs.
2. **Batch Resume Comparison**: Multi-resume side-by-side radar chart evaluating how 3 different candidate resumes match against the same target job description.
3. **Keyboard Shortcut Palette**: Command menu (`Cmd+K`) for rapid navigation between resumes, scan reports, and quick uploads.
