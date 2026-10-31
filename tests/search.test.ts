import { describe, it, expect, beforeEach } from "bun:test";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";
import { saveResume, saveScan, DEMO_USER_ID } from "@/lib/db/repository";
import { ResumeRecord, ScanRecord } from "@/lib/db/types";

describe("Global Search API & Engine Suite", () => {
  const testUserId = DEMO_USER_ID;

  const mockResume1: ResumeRecord = {
    id: "res_search_01",
    userId: testUserId,
    originalFileName: "Jane_Doe_Staff_Engineer.pdf",
    fileType: "pdf",
    fileSize: 42100,
    rawText: "Staff Software Engineer with deep expertise in Next.js, Distributed Systems, and PostgreSQL.",
    blocks: [{ id: "b1", section: "Experience", text: "Staff Engineer at Vercel" }],
    facts: [],
    sourceCoverage: { totalPages: 2, processedPages: 2, complete: true },
    sourceFileSha256: "hash_search_01",
    targetRole: "Staff Software Engineer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockResume2: ResumeRecord = {
    id: "res_search_02",
    userId: testUserId,
    originalFileName: "Alex_Product_Designer.docx",
    fileType: "docx",
    fileSize: 28500,
    rawText: "Lead Product Designer specializing in Design Systems, Figma, and UX Research.",
    blocks: [{ id: "b2", section: "Experience", text: "Lead Designer at Stripe" }],
    facts: [],
    sourceCoverage: { totalPages: 1, processedPages: 1, complete: true },
    sourceFileSha256: "hash_search_02",
    targetRole: "Lead Product Designer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockScan1: ScanRecord = {
    id: "scn_search_01",
    resumeId: mockResume1.id,
    userId: testUserId,
    targetRole: "Principal Infrastructure Architect",
    jobDescription: "Looking for an expert in Kubernetes, Terraform, and high-throughput microservices architecture.",
    jobDescriptionHash: "jd_hash_01",
    rubricVersion: "v1.0.0",
    score: 88,
    scoreBreakdown: {
      keywordSkillMatch: 35,
      roleTitleAlignment: 18,
      quantifiedImpact: 17,
      experienceDepth: 9,
      formattingAtsReadability: 9,
    },
    componentReasons: {},
    requirements: [],
    matchedKeywords: ["Kubernetes", "Microservices"],
    missingKeywords: [],
    unsupportedMissingKeywords: [],
    topImprovements: [],
    contentRisk: "low",
    parsingWarnings: [],
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await saveResume(mockResume1);
    await saveResume(mockResume2);
    await saveScan(mockScan1);
  });

  it("rejects unauthenticated requests with 401 Unauthorized", async () => {
    const req = new NextRequest("http://localhost:3000/api/search");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns recent items and navigation pages when query is empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/search", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.query).toBe("");
    expect(body.results.resumes.length).toBeGreaterThanOrEqual(2);
    expect(body.results.scans.length).toBeGreaterThanOrEqual(1);
    expect(body.results.pages.length).toBeGreaterThanOrEqual(1);
  });

  it("finds resume by original filename", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=staff_engineer", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results.resumes.length).toBeGreaterThan(0);
    expect(body.results.resumes[0].title).toContain("Staff_Engineer");
  });

  it("finds resume by format filter (docx/pdf)", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=docx", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    const docxMatches = body.results.resumes.filter((r: any) => r.fileType === "docx");
    expect(docxMatches.length).toBeGreaterThan(0);
    expect(docxMatches[0].title).toBe("Alex_Product_Designer.docx");
  });

  it("finds scan by job description keyword", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=kubernetes", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results.scans.length).toBeGreaterThan(0);
    expect(body.results.scans[0].targetRole).toBe("Principal Infrastructure Architect");
    expect(body.results.scans[0].score).toBe(88);
  });

  it("finds quick navigation page by title or keyword", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=history", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    const matchedPage = body.results.pages.find((p: any) => p.url === "/dashboard/history");
    expect(matchedPage).toBeDefined();
    expect(matchedPage.title).toBe("Analysis History");
  });

  it("returns clean empty arrays when no records match query", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=xyznonexistentterm999", {
      headers: { "x-user-id": testUserId },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.results.resumes.length).toBe(0);
    expect(body.results.scans.length).toBe(0);
    expect(body.results.pages.length).toBe(0);
  });
});
