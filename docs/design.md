# ResumeSprint — Design System & UI/UX Architecture Specification

**Version:** 2.0.0  
**Status:** Active Production System  
**Product:** ResumeSprint — Evidence-Based AI Resume Optimization Platform  
**Target Audience:** Engineering, Product Design, Frontend Development, QA  

---

## 1. Product Design Principles

ResumeSprint is an analytical, evidence-grounded career intelligence platform. The design communicates **truthfulness, precision, clarity, and control**. It does not look or feel like a generic marketing landing page, an AI gimmick, or an assembly of unstyled template widgets.

### A. Restrained Visual Discipline
- **No decorative fluff:** Eliminate glowing borders, neon gradients, random background blobs, and oversized arbitrary illustrations.
- **Surface intentionality:** Surfaces provide structural grouping, not visual clutter. Do not wrap every sentence in an independent card.
- **Meaningful color:** Color communicates semantic status (e.g., emerald for grounded evidence, amber for clarification, rose for deletions/errors) or primary navigation hierarchy.

### B. Truthful AI Representation
- **Zero Hallucination Guarantee:** The interface never displays synthetic accomplishments, fictitious metrics, or invented employer history.
- **Explicit Provenance:** All improvement proposals are anchored directly to parsed source blocks from the candidate's original resume.
- **Candidate Governance:** No silent rewrites. The candidate retains complete authority to accept, edit, reject, or undo any change.

### C. Visual Cohesion
- The landing page, authentication views, workspace shell, report dashboards, and optimization workspace share a unified design token system, font family, border language, and spacing rhythm.

---

## 2. Typography System

The typography system is engineered for maximum readability in analytical and document-heavy interfaces.

### Font Selection & Loading
- **Primary Body & Display Family:** `Geist Sans` (`var(--font-geist-sans), system-ui, -apple-system, sans-serif`). Loaded locally via Next.js Google font optimization with zero external font runtime request overhead.
- **Monospace & Code / Metrics Family:** `Geist Mono` (`var(--font-geist-mono), monospace`). Used for hashes (SHA-256), ATS identifiers, timestamps, technical diff tokens, and parsed atomic block IDs.
- **Tabular Figures:** Numbers in scores, percentages, counts, and rubric fractions use `.tabular-nums` (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum"`).

### Typography Scale & Hierarchy

| Element | Size (Desktop) | Weight | Line Height | Tracking | Purpose |
|---|---|---|---|---|---|
| **Marketing Hero** | 56–72px (3.5–4.5rem) | 800 (ExtraBold) | 1.05 | -0.035em | Main landing statement |
| **Page Title (H1)** | 24–30px (1.5–1.875rem) | 700 (Bold) | 1.20 | -0.025em | Workspace & report identity |
| **Section Heading (H2)** | 18–20px (1.125–1.25rem) | 700 (Bold) | 1.25 | -0.015em | Major content groups |
| **Component Title (H3)** | 14–15px (0.875–0.9375rem) | 600 (SemiBold) | 1.30 | -0.010em | Card headers, table titles |
| **Body (Default)** | 14px (0.875rem) | 400 (Regular) | 1.50 | 0.000em | Primary copy & feedback text |
| **Body (Small / Detail)**| 12–13px (0.75–0.8125rem) | 400 (Regular) | 1.45 | 0.000em | Supporting descriptions |
| **Metadata & Labels** | 11–12px (0.6875–0.75rem) | 600 (SemiBold) | 1.35 | +0.020em | Badges, form labels, captions |
| **Hero Numbers & Scores**| 28–44px (1.75–2.75rem) | 700 (Bold) | 1.00 | -0.030em | Match scores, KPIs, metrics |

---

## 3. Design Tokens & Color System

All colors are mapped to semantic CSS custom properties defined in [`src/app/globals.css`](file:///Users/urvilpatel/freelance-projects/resume-analyser/src/app/globals.css). Hardcoded hexadecimal colors in application components are strictly prohibited.

### A. Semantic Color Palette

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#0D0F12` | Root application background |
| `--foreground` | `#252525` | `#F3F4F6` | High-contrast body typography |
| `--card` | `#FFFFFF` | `#15181E` | Elevated content containers |
| `--card-foreground` | `#252525` | `#F3F4F6` | Container text |
| `--primary` | `#2996F3` | `#2996F3` | ResumeSprint brand blue CTA |
| `--primary-foreground`| `#FFFFFF` | `#FFFFFF` | Contrast text on brand primary |
| `--secondary` | `#F8FAFC` | `#1C2028` | Subtle surfaces & secondary buttons |
| `--secondary-foreground`| `#252525` | `#F3F4F6` | Text on secondary surfaces |
| `--muted` | `#F8FAFC` | `#1A1E26` | Inactive tracks & neutral backgrounds |
| `--muted-foreground` | `#626262` | `#9CA3AF` | Supporting descriptions & timestamps |
| `--accent` | `#EAF4FF` | `#1C2738` | Selected pills, active nav items |
| `--accent-foreground`| `#147DD8` | `#60A5FA` | Highlighting text within accents |
| `--border` | `#E8E8E8` | `#262B35` | Card outlines & structural dividers |
| `--input` | `#E8E8E8` | `#262B35` | Form borders & dropzone boundaries |
| `--ring` | `#2996F3` | `#2996F3` | Focus indicators |
| `--destructive` | `#EF4444` | `#F87171` | Deletions, diff removals, errors |

### B. Functional Status Tokens

- **Grounded Evidence (Success):** Background `bg-emerald-50`, Border `border-emerald-200`, Text `text-emerald-700`. Used for verified skills and 100% preservation badges.
- **Clarification Needed (Warning):** Background `bg-amber-50`, Border `border-amber-200`, Text `text-amber-700`. Used for unconfirmed skills and pending re-scores.
- **Gaps / Blockers (Destructive):** Background `bg-rose-50`, Border `border-rose-200`, Text `text-rose-700`. Used for unsupported requirements and diff deletions.

---

## 4. Spacing, Radii & Shadow Conventions

### Spacing System
- Base grid unit: `4px` (0.25rem).
- Component interior padding:
  - Compact: `p-3` (12px)
  - Card default: `p-5` sm:`p-6` (20px / 24px)
  - Page container: `p-4 sm:p-6 lg:p-8`
- Vertical gap between sections: `space-y-6` to `space-y-8` (24px to 32px).

### Border Radii
- Standard buttons & inputs: `rounded-lg` (8px).
- Cards & preview containers: `rounded-xl` (12px).
- Modal dialogs & hero mockups: `rounded-2xl` (16px).
- Badges & status pills: `rounded-full` (9999px).

### Elevation & Shadows
- Interactive buttons & small badges: `shadow-xs` / `shadow-sm shadow-blue-500/15`.
- Floating dialogs & interactive tooltips: `shadow-xl border border-[#E8E8E8]`.
- Cards: Rely primarily on thin `border border-[#E8E8E8]` rather than heavy drop shadows.

---

## 5. Component Specifications

### Buttons
- **Primary:** `bg-[#2996F3] hover:bg-[#147DD8] text-white font-semibold shadow-sm shadow-blue-500/20 active:scale-[0.99]`.
- **Outline / Secondary:** `border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-[#252525] font-semibold active:scale-[0.99]`.
- **Destructive:** `bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold active:scale-[0.99]`.
- **Consistent Heights:** Default `36px` (`h-9`), Small `32px` (`h-8`), Large `44px` (`h-11`).

### Form Inputs & Dropzones
- **Text Inputs & Textareas:** `border-[#E8E8E8] bg-white text-[#252525] placeholder:text-[#9CA3AF] focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20`.
- **Upload Dropzone:** Dashed `#E8E8E8` border, `#F8FAFC` background, clear file size (5MB) and format (.pdf, .docx, .txt) indicators. Accessible via keyboard tab stop and native file picker.

### Score Ring & Metrics
- SVG circular gauge with `#E8E8E8` track and `#2996F3` / `#10B981` progress strokes.
- Centered score rendered in bold `#252525` with uppercase tracking label.

### Word-Level Diffing
- Intact text: `#252525`.
- Removals: `<del>` tag with `bg-rose-50 text-rose-700 line-through decoration-rose-400 px-1 py-0.5 rounded`.
- Additions: `<ins>` tag with `bg-emerald-50 text-emerald-700 no-underline font-semibold px-1 py-0.5 rounded border border-emerald-200/60`.

---

## 6. Application Shell & Navigation

- **Sidebar Navigation (Desktop):** Refined, compact `250px` fixed sticky navigation with brand mark, grouped sections (`Workspace`: Overview, Analyze Resume, My Resumes, Analysis History; `System`: Settings), active indicator pills with `border-l-2 border-[#2996F3]` on `bg-[#EAF4FF]`, and persistent candidate session footer with quick sign-out.
- **Top Header:** `60px` (`h-15`) frosted white glass with dynamic breadcrumb trails, "Analyze Resume" primary CTA, and dropdown user profile menu. Aligned with shell padding.
- **Mobile Navigation Drawer:** Accessible slide-over drawer triggered via hamburger toggle with semi-transparent overlay backdrop, scroll lock, auto-close on navigation, and full keyboard/ESC dismissal.
- **Main Content Canvas:** Flexible full-width layout with responsive horizontal padding (`px-4 sm:px-6 lg:px-8 xl:px-10` = 32–48px on large desktop viewports). Eliminates narrow centered wrapper locks on dashboards and reports while keeping forms focused (`max-w-3xl`).

---

## 7. Page Architectures

### A. Dashboard Overview
1. **Header:** Title, supporting description, and primary CTA ("Analyze Resume").
2. **Analysis Entry Point:** High-intent hero card guiding immediate resume evaluation.
3. **Compact Summary Strip:** Restrained, tabular indicators for Saved Resumes, Diagnostic Scans, and Average Rubric Match (no oversized cards or fabricated metrics).
4. **Recent Analyses:** Structured table/list with match score badge, verified vs. unconfirmed counts, timestamp, and direct "Report" and "Optimize" action links.
5. **Saved Resume Documents:** Structured inventory with format badges, unit counts, upload dates, and direct "Inspect Facts" access.

### B. Resume Upload Flow
1. **Focused Form Container:** Compact `max-w-3xl` canvas.
2. **Main Upload Panel:** Well-proportioned drop panel with clear formats (.pdf, .docx, .txt), size constraints (5MB), keyboard accessibility, and "Load sample data" shortcut.
3. **Selected File Display:** Structured card with file icon, formatted size, and quick removal.
4. **Target Role & Job Description:** Clean input and textarea with live character counter.
5. **4-Stage Processing State:** Clear visual progress during server extraction and scoring.

### C. Analysis Report Architecture
1. **Header Summary:** Target position title, source document name, scan timestamp, and direct action buttons.
2. **Two-Column Layout (Desktop):**
   - **Primary Column (8 cols):**
     - Executive assessment overview with qualitative interpretation.
     - Canonical Rubric v1 breakdown with point values and dimension descriptions.
     - Prioritized improvement action plan (`01`, `02`, `03`).
     - Requirement grounding chips (verified, unconfirmed, unsupported gaps).
     - Job description reference with SHA-256 hash.
   - **Secondary Column (4 cols, Sticky):**
     - Sticky summary card with `ScoreRing`, score tier, and tripartite counts.
     - Primary "Launch Optimization Workspace" CTA and "Inspect Facts" button.
     - Zero Hallucination Guarantee notice.
3. **Mobile Responsive Flow:** Stacks logically into a single readable document column.

---

## 8. Accessibility & Usability Standards

- **WCAG 2.1 AA Compliance:** Minimum color contrast of 4.5:1 for normal text and 3:1 for large text and UI components.
- **Focus Rings:** Explicit 2px `#2996F3` outline with 2px offset on all interactive focus-visible elements.
- **Motion Reduction:** Full `@media (prefers-reduced-motion: reduce)` support in `globals.css` with instant transitions and zero forced animation delays.
- **Hydration Safe:** `suppressHydrationWarning` on root HTML/Body elements prevents extension-induced hydration mismatches.

---

## 9. Acceptable vs. Unacceptable Patterns

| Feature | Acceptable Pattern | Unacceptable Pattern |
|---|---|---|
| **Scores** | Direct Rubric v1 calculation with tabular figures | Vague percentages or random progress bars |
| **Rewrites** | Anchored to existing block facts with word diffs | Silent complete rewrites that invent achievements |
| **Gaps** | Explicitly shown as unsupported gaps | Hallucinating keywords to inflate match scores |
| **Surfaces** | White cards on subtle `#F8FAFC` backgrounds | Cards nested inside cards with glowing borders |
| **Colors** | Semantic emerald, amber, rose, and ResumeSprint blue | Random rainbow gradients and neon highlights |
| **Icons** | Purposeful functional icons matching actions | Floating decorative shapes and generic AI stars |
