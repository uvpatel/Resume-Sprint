import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authenticateRequest } from "@/lib/security/authorization";
import { getResumesByUserId, getScansByUserId } from "@/lib/db/repository";

export interface SearchResultResume {
  id: string;
  title: string;
  fileType: "pdf" | "docx" | "txt" | "doc";
  targetRole: string | null;
  fileSize: number;
  createdAt: string;
  url: string;
}

export interface SearchResultScan {
  id: string;
  resumeId: string;
  resumeTitle: string;
  targetRole: string;
  score: number;
  snippet: string;
  createdAt: string;
  url: string;
}

export interface SearchResultPage {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
  keywords: string[];
}

export interface SearchResponse {
  query: string;
  results: {
    resumes: SearchResultResume[];
    scans: SearchResultScan[];
    pages: SearchResultPage[];
  };
}

const STATIC_PAGES: SearchResultPage[] = [
  {
    id: "nav-dash",
    title: "Dashboard Overview",
    category: "Navigation",
    url: "/dashboard",
    description: "High-level metrics, activity overview, and inventory counts",
    keywords: ["dashboard", "home", "metrics", "overview", "kpi", "stats"],
  },
  {
    id: "nav-new",
    title: "New Scan / Upload Resume",
    category: "Actions",
    url: "/dashboard/new",
    description: "Upload a PDF, DOCX, or TXT resume to evaluate against a job description",
    keywords: ["upload", "new", "scan", "analyze", "job", "target", "resume", "file"],
  },
  {
    id: "nav-resumes",
    title: "My Resumes",
    category: "Navigation",
    url: "/dashboard/resumes",
    description: "Browse, inspect, and manage all retained resumes and source spans",
    keywords: ["resumes", "files", "documents", "inventory", "pdf", "docx", "txt", "list"],
  },
  {
    id: "nav-history",
    title: "Analysis History",
    category: "Navigation",
    url: "/dashboard/history",
    description: "View past ATS evaluation records, match scores, and rubric benchmarks",
    keywords: ["history", "scans", "past", "scores", "evaluations", "rubric", "runs"],
  },
  {
    id: "nav-settings",
    title: "Account Settings",
    category: "Navigation",
    url: "/dashboard/settings",
    description: "Workspace profile, active session credentials, and preferences",
    keywords: ["settings", "account", "profile", "user", "email", "preferences", "config"],
  },
];

export async function GET(req: NextRequest) {
  try {
    let user: { id: string; email?: string; name?: string | null } | null = null;
    try {
      user = await authenticateRequest(req);
    } catch {
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    // Fetch user's resumes and scans in parallel
    const [resumes, scans] = await Promise.all([
      getResumesByUserId(user.id),
      getScansByUserId(user.id),
    ]);

    const resumeMap = new Map(resumes.map((r) => [r.id, r]));

    // Empty query: return recent items and top pages for instant display
    if (!query) {
      return NextResponse.json<SearchResponse>({
        query: "",
        results: {
          resumes: resumes.slice(0, 4).map((r) => ({
            id: r.id,
            title: r.originalFileName,
            fileType: r.fileType,
            targetRole: r.targetRole || null,
            fileSize: r.fileSize,
            createdAt: r.createdAt,
            url: `/dashboard/resumes/${r.id}`,
          })),
          scans: scans.slice(0, 4).map((s) => ({
            id: s.id,
            resumeId: s.resumeId,
            resumeTitle: resumeMap.get(s.resumeId)?.originalFileName || "Resume Document",
            targetRole: s.targetRole || "Target Role",
            score: s.score,
            snippet: s.jobDescription ? s.jobDescription.slice(0, 70).trim() + "..." : "",
            createdAt: s.createdAt,
            url: `/dashboard/resumes/${s.resumeId}/scan`,
          })),
          pages: STATIC_PAGES.slice(0, 4),
        },
      });
    }

    // Filter resumes by filename, format, target role, or text excerpt
    const matchedResumes: SearchResultResume[] = resumes
      .filter((r) => {
        const nameMatch = r.originalFileName.toLowerCase().includes(query);
        const formatMatch = r.fileType.toLowerCase().includes(query);
        const roleMatch = r.targetRole ? r.targetRole.toLowerCase().includes(query) : false;
        const rawTextMatch = r.rawText ? r.rawText.toLowerCase().includes(query) : false;
        return nameMatch || formatMatch || roleMatch || rawTextMatch;
      })
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        title: r.originalFileName,
        fileType: r.fileType,
        targetRole: r.targetRole || null,
        fileSize: r.fileSize,
        createdAt: r.createdAt,
        url: `/dashboard/resumes/${r.id}`,
      }));

    // Filter scans by target role, job description text, or resume title
    const matchedScans: SearchResultScan[] = scans
      .filter((s) => {
        const roleMatch = s.targetRole ? s.targetRole.toLowerCase().includes(query) : false;
        const jdMatch = s.jobDescription ? s.jobDescription.toLowerCase().includes(query) : false;
        const resumeTitle = resumeMap.get(s.resumeId)?.originalFileName || "";
        const resumeMatch = resumeTitle.toLowerCase().includes(query);
        const scoreMatch =
          query.startsWith(">") || query.startsWith("<")
            ? false
            : query === `${s.score}` || (query.startsWith("score") && query.includes(`${s.score}`));
        return roleMatch || jdMatch || resumeMatch || scoreMatch;
      })
      .slice(0, 6)
      .map((s) => {
        const resume = resumeMap.get(s.resumeId);
        let snippet = "";
        if (s.jobDescription) {
          const idx = s.jobDescription.toLowerCase().indexOf(query);
          if (idx !== -1) {
            const start = Math.max(0, idx - 25);
            const end = Math.min(s.jobDescription.length, idx + query.length + 45);
            snippet = (start > 0 ? "..." : "") + s.jobDescription.slice(start, end).trim() + "...";
          } else {
            snippet = s.jobDescription.slice(0, 75).trim() + "...";
          }
        }
        return {
          id: s.id,
          resumeId: s.resumeId,
          resumeTitle: resume?.originalFileName || "Resume Document",
          targetRole: s.targetRole || "Role Assessment",
          score: s.score,
          snippet,
          createdAt: s.createdAt,
          url: `/dashboard/resumes/${s.resumeId}/scan`,
        };
      });

    // Filter navigation pages
    const matchedPages: SearchResultPage[] = STATIC_PAGES.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(query);
      const descMatch = p.description.toLowerCase().includes(query);
      const kwMatch = p.keywords.some((k) => k.toLowerCase().includes(query));
      return titleMatch || descMatch || kwMatch;
    }).slice(0, 4);

    return NextResponse.json<SearchResponse>({
      query,
      results: {
        resumes: matchedResumes,
        scans: matchedScans,
        pages: matchedPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
