import {
  ResumeData,
  SourceFact,
  SourceCoverage,
  Preservation,
  Patch,
} from '@/types/resume-sprint';

export class PreservationService {
  /**
   * Evaluates 100% factual preservation between the immutable source facts/resume
   * and the current draft resume data.
   */
  public static evaluate(params: {
    sourceResume: ResumeData;
    currentDraft: ResumeData;
    sourceFacts: SourceFact[];
    sourceCoverage: SourceCoverage;
    acceptedPatches?: Patch[];
  }): Preservation {
    const { sourceResume, currentDraft, sourceFacts, sourceCoverage, acceptedPatches = [] } = params;

    // Gate 1: Source Coverage check
    if (!sourceCoverage.complete || sourceCoverage.unmappedSpanIds.length > 0 || sourceCoverage.unresolvedSpanIds.length > 0) {
      return {
        status: 'UNVERIFIED',
        totalFacts: null,
        preservedFacts: null,
        missingFactIds: [],
        unresolvedFactIds: sourceCoverage.unresolvedSpanIds,
        alteredProtectedFields: [],
        unsupportedClaimIds: [],
        categoryCounts: this.computeCategoryCounts(sourceResume, currentDraft),
        contentPreservedPercentage: null,
        contentPreservedPercent: null,
      };
    }

    const missingFactIds: string[] = [];
    const unresolvedFactIds: string[] = [];
    const alteredProtectedFields: string[] = [];
    const unsupportedClaimIds: string[] = [];

    // Protected field checks: BasicInfo
    if (sourceResume.basicInfo.name !== currentDraft.basicInfo.name) {
      alteredProtectedFields.push('basicInfo.name');
    }
    if (sourceResume.basicInfo.email !== currentDraft.basicInfo.email) {
      alteredProtectedFields.push('basicInfo.email');
    }
    if (sourceResume.basicInfo.phone !== currentDraft.basicInfo.phone) {
      alteredProtectedFields.push('basicInfo.phone');
    }

    // Category counts check
    const categoryCounts = this.computeCategoryCounts(sourceResume, currentDraft);

    // Check language, hobbies, custom sections retention
    if (currentDraft.languageEntries.length < sourceResume.languageEntries.length) {
      missingFactIds.push('missing_language_entry');
    }
    if (currentDraft.hobbiesData.length < sourceResume.hobbiesData.length) {
      missingFactIds.push('missing_hobby_entry');
    }
    if (currentDraft.customSections.length < sourceResume.customSections.length) {
      missingFactIds.push('missing_custom_section');
    }

    // Protected field checks: Experience
    for (const srcExp of sourceResume.experience) {
      const draftExp = currentDraft.experience.find((e) => e.id === srcExp.id);
      if (!draftExp) {
        missingFactIds.push(`exp_${srcExp.id}`);
        continue;
      }
      if (srcExp.company !== draftExp.company) {
        alteredProtectedFields.push(`experience.${srcExp.id}.company`);
      }
      if (srcExp.startDate !== draftExp.startDate || srcExp.endDate !== draftExp.endDate) {
        alteredProtectedFields.push(`experience.${srcExp.id}.dates`);
      }
      if (srcExp.location !== draftExp.location) {
        alteredProtectedFields.push(`experience.${srcExp.id}.location`);
      }
    }

    // Protected field checks: Education
    for (const srcEdu of sourceResume.educationEntries) {
      const draftEdu = currentDraft.educationEntries.find((e) => e.id === srcEdu.id);
      if (!draftEdu) {
        missingFactIds.push(`edu_${srcEdu.id}`);
        continue;
      }
      if (srcEdu.institution !== draftEdu.institution) {
        alteredProtectedFields.push(`educationEntries.${srcEdu.id}.institution`);
      }
      if (srcEdu.degree !== draftEdu.degree) {
        alteredProtectedFields.push(`educationEntries.${srcEdu.id}.degree`);
      }
    }

    // Verify source facts against draft
    // An accepted patch explicitly authorizes a text transformation
    const approvedReplacements = new Map<string, string>(); // before -> after or factId -> after
    for (const patch of acceptedPatches) {
      approvedReplacements.set(patch.before.trim(), patch.after.trim());
      for (const factId of patch.sourceFactIds) {
        approvedReplacements.set(factId, patch.after.trim());
      }
    }

    // Search all text content in draft
    const draftAllText = this.collectAllText(currentDraft);

    let preservedCount = 0;
    const totalFacts = Math.max(sourceFacts.length, 1);

    for (const fact of sourceFacts) {
      const factText = fact.exactText.trim();
      const approvedTarget = approvedReplacements.get(factText) || approvedReplacements.get(fact.factId);

      if (approvedTarget) {
        // Fact was legitimately updated via an accepted proposal
        if (draftAllText.includes(approvedTarget)) {
          preservedCount++;
        } else {
          missingFactIds.push(fact.factId);
        }
      } else {
        // Structured fact verification
        let isPreserved = false;
        if (fact.kind === 'NAME') {
          isPreserved = currentDraft.basicInfo.name === fact.exactText;
        } else if (fact.kind === 'TITLE') {
          isPreserved = currentDraft.experience.some(
            (e) => e.id === fact.entryId && e.title === fact.protectedValues?.title && e.company === fact.protectedValues?.company
          );
        } else if (fact.kind === 'EDUCATION') {
          isPreserved = currentDraft.educationEntries.some(
            (e) => e.id === fact.entryId && e.degree === fact.protectedValues?.degree && e.institution === fact.protectedValues?.institution
          );
        } else if (fact.kind === 'LANGUAGE') {
          isPreserved = currentDraft.languageEntries.some(
            (l) => l.id === fact.entryId && l.language === fact.protectedValues?.language
          );
        } else if (fact.kind === 'SKILL') {
          isPreserved = currentDraft.skillEntries.some((s) => s.name === fact.exactText);
        } else {
          isPreserved = draftAllText.includes(factText);
        }

        if (isPreserved) {
          preservedCount++;
        } else {
          unresolvedFactIds.push(fact.factId);
        }
      }
    }

    // Check for placeholder patterns and ungrounded invented metrics
    const placeholderPattern = /\[(X|\.{3}|insert|metric|placeholder|your|number)\]/i;
    for (const exp of currentDraft.experience) {
      for (const bullet of exp.bullets) {
        if (placeholderPattern.test(bullet)) {
          unsupportedClaimIds.push(`placeholder_in_${exp.id}`);
        }
      }
    }

    // Determine Status
    const hasFailures =
      missingFactIds.length > 0 ||
      unresolvedFactIds.length > 0 ||
      alteredProtectedFields.length > 0 ||
      unsupportedClaimIds.length > 0;

    if (hasFailures) {
      return {
        status: 'FAILED',
        totalFacts,
        preservedFacts: preservedCount,
        missingFactIds,
        unresolvedFactIds,
        alteredProtectedFields,
        unsupportedClaimIds,
        categoryCounts,
        contentPreservedPercentage: null,
        contentPreservedPercent: null,
      };
    }

    // Fully validated: all facts preserved and resolved
    const percentage = 100;

    return {
      status: 'VALIDATED',
      totalFacts,
      preservedFacts: totalFacts,
      missingFactIds: [],
      unresolvedFactIds: [],
      alteredProtectedFields: [],
      unsupportedClaimIds: [],
      categoryCounts,
      contentPreservedPercentage: percentage,
      contentPreservedPercent: percentage,
    };
  }

  private static computeCategoryCounts(src: ResumeData, draft: ResumeData): Record<string, { original: number; returned: number }> {
    return {
      experience: { original: src.experience.length, returned: draft.experience.length },
      education: { original: src.educationEntries.length, returned: draft.educationEntries.length },
      skills: { original: src.skillEntries.length, returned: draft.skillEntries.length },
      projects: { original: src.projectEntries.length, returned: draft.projectEntries.length },
      certifications: { original: src.certificationEntries.length, returned: draft.certificationEntries.length },
      achievements: { original: src.achievementEntries.length, returned: draft.achievementEntries.length },
      languages: { original: src.languageEntries.length, returned: draft.languageEntries.length },
      hobbies: { original: src.hobbiesData.length, returned: draft.hobbiesData.length },
      customSections: { original: src.customSections.length, returned: draft.customSections.length },
    };
  }

  private static collectAllText(resume: ResumeData): string {
    const pieces: string[] = [
      resume.basicInfo.name,
      resume.basicInfo.title || '',
      resume.summary,
    ];

    for (const exp of resume.experience) {
      pieces.push(exp.title, exp.company, exp.location, exp.startDate, exp.endDate, ...exp.bullets);
      pieces.push(`${exp.title} | ${exp.company} | ${exp.location} | ${exp.startDate}–${exp.endDate}`);
      pieces.push(`${exp.title} | ${exp.company} | ${exp.location} | ${exp.startDate}-${exp.endDate}`);
    }
    for (const edu of resume.educationEntries) {
      pieces.push(edu.degree, edu.field, edu.institution);
      pieces.push(`${edu.degree} | ${edu.institution} | ${edu.startDate}–${edu.endDate}`);
      pieces.push(`${edu.degree} | ${edu.institution} | ${edu.startDate}-${edu.endDate}`);
    }
    for (const sk of resume.skillEntries) {
      pieces.push(sk.name);
    }
    for (const pr of resume.projectEntries) {
      pieces.push(pr.title, pr.description, ...pr.bullets, ...pr.technologies);
    }
    for (const cert of resume.certificationEntries) {
      pieces.push(cert.name, cert.issuer);
    }
    for (const ach of resume.achievementEntries) {
      pieces.push(ach.title, ach.description);
    }
    for (const lang of resume.languageEntries) {
      pieces.push(lang.language, lang.proficiency);
      pieces.push(`${lang.language} (${lang.proficiency})`);
    }
    for (const hob of resume.hobbiesData) {
      pieces.push(typeof hob === 'string' ? hob : hob.name);
    }
    for (const cs of resume.customSections) {
      pieces.push(cs.title);
      pieces.push(JSON.stringify(cs.items));
    }

    return pieces.join('\n');
  }
}
