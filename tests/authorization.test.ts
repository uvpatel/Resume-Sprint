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
import {
  saveResume,
  getResumeById,
  deleteResume,
  getScanById,
} from "@/lib/db/repository";
import { ResumeRecord } from "@/lib/db/types";

describe("Route Authorization & Ownership Protection", () => {
  const userA = "usr_user_A";
  const userB = "usr_user_B";

  const resumeA: ResumeRecord = {
    id: "res_auth_test_A",
    userId: userA,
    originalFileName: "userA_resume.pdf",
    fileType: "pdf",
    fileSize: 1024,
    rawText: "Sample text for User A",
    blocks: [{ id: "b1", section: "Experience", text: "Software Engineer at Acme" }],
    facts: [{ factId: "f1", entryId: "b1", section: "Experience", exactText: "Software Engineer at Acme", kind: "role" }],
    sourceCoverage: { totalPages: 1, processedPages: 1, complete: true },
    sourceFileSha256: "hash_user_a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("stores and retrieves a record by ID", async () => {
    await saveResume(resumeA);
    const retrieved = await getResumeById(resumeA.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.userId).toBe(userA);
  });

  it("denies deletion if user does not own the resume", async () => {
    await saveResume(resumeA);
    // User B attempts to delete User A's resume
    const deleted = await deleteResume(resumeA.id, userB);
    expect(deleted).toBe(false);

    // Verify it still exists
    const stillExists = await getResumeById(resumeA.id);
    expect(stillExists).not.toBeNull();
  });

  it("allows deletion when authenticated user is the legitimate owner", async () => {
    await saveResume(resumeA);
    const deleted = await deleteResume(resumeA.id, userA);
    expect(deleted).toBe(true);

    const nowGone = await getResumeById(resumeA.id);
    expect(nowGone).toBeNull();
  });

  it("handles non-existent or invalid IDs safely", async () => {
    const missingResume = await getResumeById("res_non_existent_id");
    expect(missingResume).toBeNull();

    const missingScan = await getScanById("scn_non_existent_id");
    expect(missingScan).toBeNull();
  });
});
