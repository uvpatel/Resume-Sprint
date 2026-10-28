import {
  Score,
  ScoreBreakdown,
  Snapshot,
  ResumeData,
  EffectiveATS,
  JobRequirement,
} from '@/types/resume-sprint';
import { ApiError } from '@/lib/errors/api-error';

export const ALLOWED_ATS_CONFIGS: EffectiveATS[] = [
  'Generic',
  'Workday',
  'Greenhouse',
  'Lever',
  'Taleo',
  'iCIMS',
];

export class ScoreService {
  /**
   * Deterministically calculates canonical Rubric v1 score.
   * Rubric v1 Maximums:
   * - keywordSkillMatch: 40
   * - roleTitleAlignment: 20
   * - quantifiedImpact: 20
   * - experienceDepth: 10
   * - formattingAtsReadability: 10
   * Total = Sum of components (0 to 100)
   */
  public static calculateScore(params: {
    resume: ResumeData;
    jd: string;
    targetRole: string;
    requirements: JobRequirement[];
    effectiveATS: EffectiveATS;
    snapshot: Snapshot;
  }): Score {
    const { resume, jd, targetRole, requirements, effectiveATS, snapshot } = params;

    // 1. Keyword & Skill Match (max 40)
    let keywordScore = 0;
    if (requirements.length > 0) {
      const matchedCount = requirements.filter((r) => r.status === 'MATCHED').length;
      keywordScore = Math.min(40, Math.round((matchedCount / requirements.length) * 40));
    } else {
      // Fallback lexical scan against JD
      const resumeText = this.collectResumeText(resume).toLowerCase();
      const jdTerms = this.extractKeyTerms(jd);
      if (jdTerms.length > 0) {
        const matches = jdTerms.filter((term) => resumeText.includes(term.toLowerCase()));
        keywordScore = Math.min(40, Math.round((matches.length / jdTerms.length) * 40));
      } else {
        keywordScore = 20;
      }
    }

    // 2. Role Title Alignment (max 20)
    let roleTitleScore = 0;
    const targetLower = targetRole.toLowerCase().trim();
    const currentTitle = (resume.basicInfo.title || '').toLowerCase();
    const expTitles = resume.experience.map((e) => e.title.toLowerCase());

    if (currentTitle && targetLower && (currentTitle.includes(targetLower) || targetLower.includes(currentTitle))) {
      roleTitleScore = 20;
    } else if (expTitles.some((t) => t.includes(targetLower) || targetLower.includes(t))) {
      roleTitleScore = 16;
    } else {
      // Partial word overlap
      const targetWords = targetLower.split(/\s+/).filter((w) => w.length > 2);
      const matches = targetWords.filter((w) => currentTitle.includes(w) || expTitles.some((t) => t.includes(w)));
      roleTitleScore = targetWords.length > 0 ? Math.round((matches.length / targetWords.length) * 12) : 10;
    }

    // 3. Quantified Impact (max 20)
    // Counts metrics, percentages, currency, numerical results
    let impactScore = 0;
    const metricRegex = /(\d+([.,]\d+)?\s*(%|\+|k|m|b|x|million|billion|users|customers|hours|days|percent))/i;
    let metricBulletCount = 0;
    let totalBullets = 0;

    for (const exp of resume.experience) {
      for (const b of exp.bullets) {
        totalBullets++;
        if (metricRegex.test(b)) {
          metricBulletCount++;
        }
      }
    }

    if (totalBullets > 0) {
      const metricRatio = metricBulletCount / totalBullets;
      impactScore = Math.min(20, Math.round(metricRatio * 25)); // 80% bullets with metrics gets full 20
    }

    // 4. Experience Depth (max 10)
    // Years/progression and bullet depth
    let depthScore = 0;
    if (resume.experience.length >= 3) depthScore += 5;
    else if (resume.experience.length >= 1) depthScore += 3;

    if (totalBullets >= 6) depthScore += 5;
    else if (totalBullets >= 3) depthScore += 3;
    depthScore = Math.min(10, depthScore);

    // 5. Formatting & ATS Readability (max 10)
    // Evaluates structure: basicInfo completeness, ATS compliance
    let formatScore = 0;
    if (resume.basicInfo.name && resume.basicInfo.email) formatScore += 4;
    if (resume.basicInfo.phone && resume.basicInfo.location) formatScore += 2;
    if (resume.experience.length > 0 && resume.educationEntries.length > 0) formatScore += 2;
    if (['Workday', 'Greenhouse', 'Lever', 'Generic'].includes(effectiveATS)) formatScore += 2;
    formatScore = Math.min(10, formatScore);

    const breakdown: ScoreBreakdown = {
      keywordSkillMatch: keywordScore,
      roleTitleAlignment: roleTitleScore,
      quantifiedImpact: impactScore,
      experienceDepth: depthScore,
      formattingAtsReadability: formatScore,
    };

    const total =
      breakdown.keywordSkillMatch +
      breakdown.roleTitleAlignment +
      breakdown.quantifiedImpact +
      breakdown.experienceDepth +
      breakdown.formattingAtsReadability;

    // Safety invariant: total must strictly equal sum of components
    if (total !== keywordScore + roleTitleScore + impactScore + depthScore + formatScore) {
      throw ApiError.unprocessable('Score total does not equal the sum of its components.', 'Review score calculation rules', 'SCORE_BREAKDOWN_MISMATCH');
    }

    return {
      snapshot,
      score: total,
      scoreBreakdown: breakdown,
      status: 'CURRENT',
      createdAt: new Date().toISOString(),
    };
  }

  private static collectResumeText(resume: ResumeData): string {
    const text: string[] = [
      resume.basicInfo.name,
      resume.basicInfo.title || '',
      resume.summary,
    ];
    for (const exp of resume.experience) {
      text.push(exp.title, exp.company, ...exp.bullets);
    }
    for (const s of resume.skillEntries) {
      text.push(s.name);
    }
    return text.join(' ');
  }

  private static extractKeyTerms(jd: string): string[] {
    const commonWords = new Set(['and', 'the', 'with', 'for', 'are', 'you', 'will', 'our', 'that', 'this', 'from']);
    return jd
      .split(/[\s,.;:()/\\]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !commonWords.has(w.toLowerCase()))
      .slice(0, 30);
  }
}
