// Polyfill for Bun node:v8 startup snapshot check
if (typeof process !== "undefined" && typeof (process as any).getBuiltinModule === "function") {
  try {
    const v8 = (process as any).getBuiltinModule("v8");
    if (v8) {
      v8.startupSnapshot = { isBuildingSnapshot: () => false };
    }
  } catch {}
}

import { describe, it, expect } from "bun:test";
import { auth, requireSession, requireOwnedResume, requireOwnedScanSession } from "@/lib/auth";
import { authenticateRequest, assertSessionOwnership } from "@/lib/security/authorization";
import { saveResume } from "@/lib/db/repository";
import { ScanSessionRepository } from "@/server/persistence/repository";
import { ResumeRecord } from "@/lib/db/types";
import { NextRequest } from "next/server";

describe("Better Auth & Security Integration Tests", () => {
  const testUserId = "usr_auth_tester_01";
  const intruderUserId = "usr_intruder_99";

  describe("Better Auth Configuration & Handlers", () => {
    it("initializes Better Auth with configured MongoDB adapter and GitHub social provider", () => {
      expect(auth).toBeDefined();
      expect(auth.options).toBeDefined();
      expect(auth.options.socialProviders?.github).toBeDefined();
      expect(auth.handler).toBeDefined();
    });

    it("handles get-session request gracefully when no cookies are provided", async () => {
      const req = new Request("http://localhost:3000/api/auth/get-session", {
        method: "GET",
        headers: new Headers(),
      });
      const res = await auth.handler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toBeNull();
    });

    it("initiates GitHub social sign-in and generates an authorization redirect URL", async () => {
      const req = new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "github",
          callbackURL: "http://localhost:3000/dashboard",
        }),
      });

      const res = await auth.handler(req);
      // Better Auth returns a redirect response or a JSON object containing the OAuth redirect url
      expect([200, 302, 307]).toContain(res.status);

      if (res.status === 200) {
        const json = await res.json();
        expect(json.url || json.redirect).toBeDefined();
        const targetUrl = json.url || json.redirect;
        expect(targetUrl).toContain("github.com/login/oauth/authorize");
      } else {
        const location = res.headers.get("location");
        expect(location).toContain("github.com/login/oauth/authorize");
      }
    });
  });

  describe("Server-Side Session Validation (requireSession)", () => {
    it("rejects unauthenticated requests without headers with an unauthorized error", async () => {
      const emptyHeaders = new Headers();
      let errorThrown = false;
      try {
        await requireSession(emptyHeaders);
      } catch (err: any) {
        errorThrown = true;
        expect(err.statusCode || err.status).toBe(401);
      }
      expect(errorThrown).toBe(true);
    });

    it("accepts valid test user header and creates session object", async () => {
      const headers = new Headers({
        "x-user-id": testUserId,
      });
      const session = await requireSession(headers);
      expect(session).toBeDefined();
      expect(session.user.id).toBe(testUserId);
      expect(session.session.userId).toBe(testUserId);
    });

    it("accepts valid bearer token header and derives user identity", async () => {
      const headers = new Headers({
        authorization: `Bearer ${testUserId}`,
      });
      const session = await requireSession(headers);
      expect(session).toBeDefined();
      expect(session.user.id).toBe(testUserId);
    });
  });

  describe("Resource Ownership Verification", () => {
    const testResume: ResumeRecord = {
      id: "res_owner_test_001",
      userId: testUserId,
      originalFileName: "test_resume.pdf",
      fileType: "pdf",
      fileSize: 2048,
      rawText: "Sample text for ownership verification",
      blocks: [{ id: "b1", section: "Experience", text: "Software Engineer" }],
      facts: [{ factId: "f1", entryId: "b1", section: "Experience", exactText: "Software Engineer", kind: "role" }],
      sourceCoverage: { totalPages: 1, processedPages: 1, complete: true },
      sourceFileSha256: "test_sha_256",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("allows owner to access their own resume", async () => {
      await saveResume(testResume);
      const resume = await requireOwnedResume(testResume.id, testUserId);
      expect(resume).toBeDefined();
      expect(resume.id).toBe(testResume.id);
      expect(resume.userId).toBe(testUserId);
    });

    it("forbids non-owner from accessing another user's resume", async () => {
      let forbiddenCaught = false;
      try {
        await requireOwnedResume(testResume.id, intruderUserId);
      } catch (err: any) {
        forbiddenCaught = true;
        expect(err.statusCode || err.status).toBe(403);
      }
      expect(forbiddenCaught).toBe(true);
    });

    it("throws 404 Not Found for non-existent resume", async () => {
      let notFoundCaught = false;
      try {
        await requireOwnedResume("res_does_not_exist", testUserId);
      } catch (err: any) {
        notFoundCaught = true;
        expect(err.statusCode || err.status).toBe(404);
      }
      expect(notFoundCaught).toBe(true);
    });

    it("throws 400 Bad Request if resume ID is missing", async () => {
      let badRequestCaught = false;
      try {
        await requireOwnedResume("", testUserId);
      } catch (err: any) {
        badRequestCaught = true;
        expect(err.statusCode || err.status).toBe(400);
      }
      expect(badRequestCaught).toBe(true);
    });

    it("verifies scan session ownership correctly", async () => {
      const mockSession = {
        id: "scn_owner_test_100",
        userId: testUserId,
        sourceResumeId: "res_owner_test_001",
        sourceVersion: 1,
        targetRole: "Engineer",
        jobDescription: "Sample JD",
        state: "ACTIVE" as const,
        currentDraftVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await ScanSessionRepository.create(mockSession as any);

      // Owner passes
      const session = await requireOwnedScanSession(mockSession.id, testUserId);
      expect(session).toBeDefined();
      expect(session.id).toBe(mockSession.id);

      // Non-owner gets 403 Forbidden
      let forbiddenCaught = false;
      try {
        await requireOwnedScanSession(mockSession.id, intruderUserId);
      } catch (err: any) {
        forbiddenCaught = true;
        expect(err.statusCode || err.status).toBe(403);
      }
      expect(forbiddenCaught).toBe(true);

      // Non-existent session gets 404
      let notFoundCaught = false;
      try {
        await requireOwnedScanSession("scn_non_existent", testUserId);
      } catch (err: any) {
        notFoundCaught = true;
        expect(err.statusCode || err.status).toBe(404);
      }
      expect(notFoundCaught).toBe(true);
    });
  });

  describe("API Request Authentication (authenticateRequest)", () => {
    it("rejects unauthenticated NextRequest with 401 Unauthorized", async () => {
      const nextReq = new NextRequest("http://localhost:3000/api/v1/resumes");
      let caught = false;
      try {
        await authenticateRequest(nextReq);
      } catch (err: any) {
        caught = true;
        expect(err.statusCode || err.status).toBe(401);
      }
      expect(caught).toBe(true);
    });

    it("authenticates NextRequest with valid credentials and returns userId", async () => {
      const nextReq = new NextRequest("http://localhost:3000/api/v1/resumes", {
        headers: {
          "x-user-id": testUserId,
        },
      });
      const user = await authenticateRequest(nextReq);
      expect(user.id).toBe(testUserId);
    });

    it("asserts session ownership correctly and prevents unauthorized access", () => {
      const session = {
        sessionId: "sess_123",
        userId: testUserId,
        resumeId: "res_123",
        jobTargetId: "job_123",
      } as any;

      // Legitimate owner passes
      expect(() => assertSessionOwnership(session, testUserId)).not.toThrow();

      // Intruder throws 403 Forbidden
      expect(() => assertSessionOwnership(session, intruderUserId)).toThrow();
    });
  });
});
