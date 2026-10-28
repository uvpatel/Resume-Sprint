import { z } from 'zod';
import { ResumeData } from '@/types/resume-sprint';

export const BasicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  email: z.string().email().or(z.string().min(3)),
  phone: z.string().default(''),
  location: z.string().default(''),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
}).passthrough();

export const ExperienceEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
}).passthrough();

export const EducationEntrySchema = z.object({
  id: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().default(''),
  institution: z.string().min(1),
  location: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  gpa: z.string().optional(),
}).passthrough();

export const SkillEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  level: z.string().optional(),
}).passthrough();

export const ProjectEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  bullets: z.array(z.string()).default([]),
  url: z.string().optional(),
  technologies: z.array(z.string()).default([]),
}).passthrough();

export const CertificationEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().default(''),
  issueDate: z.string().default(''),
  expirationDate: z.string().default(''),
  url: z.string().optional(),
}).passthrough();

export const AchievementEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  date: z.string().default(''),
}).passthrough();

export const LanguageEntrySchema = z.object({
  id: z.string().min(1),
  language: z.string().min(1),
  proficiency: z.string().default(''),
}).passthrough();

export const HobbyItemSchema = z.union([
  z.string(),
  z.object({ id: z.string(), name: z.string() }).passthrough(),
]);

export const CustomSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(z.unknown()).default([]),
}).passthrough();

export const ResumeDataSchema = z.object({
  basicInfo: BasicInfoSchema,
  summary: z.string().default(''),
  summaryAiEnabled: z.boolean().default(true),
  experience: z.array(ExperienceEntrySchema).default([]),
  educationEntries: z.array(EducationEntrySchema).default([]),
  skillEntries: z.array(SkillEntrySchema).default([]),
  projectEntries: z.array(ProjectEntrySchema).default([]),
  certificationEntries: z.array(CertificationEntrySchema).default([]),
  achievementEntries: z.array(AchievementEntrySchema).default([]),
  languageEntries: z.array(LanguageEntrySchema).default([]),
  hobbiesData: z.array(HobbyItemSchema).default([]),
  customSections: z.array(CustomSectionSchema).default([]),
}).passthrough();

/**
 * List of paths and attributes considered immutable/protected source facts.
 * Normal optimization proposals cannot alter these without explicit user source-correction.
 */
export const PROTECTED_FIELD_PATTERNS = [
  /^basicInfo\.(name|email|phone|location|linkedin|website|github)$/,
  /^experience(\[\w+\]|\.\d+)\.(company|startDate|endDate|location)$/,
  /^educationEntries(\[\w+\]|\.\d+)\.(institution|degree|startDate|endDate)$/,
  /^certificationEntries(\[\w+\]|\.\d+)\.(issuer|issueDate)$/,
];

export function isProtectedFieldPath(path: string): boolean {
  if (path.includes('__proto__') || path.includes('constructor') || path.includes('prototype')) {
    return true;
  }
  return PROTECTED_FIELD_PATTERNS.some((pattern) => pattern.test(path));
}

export function validateResumeData(data: unknown): { success: true; data: ResumeData } | { success: false; error: string } {
  const result = ResumeDataSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: errorMsg };
  }
  return { success: true, data: result.data as ResumeData };
}

export function cloneResumeData(data: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Resolves a field value from ResumeData using either an entry ID (e.g. `b1` or `experience[e1].bullets[0]`)
 * or a dot-path (e.g. `summary`, `experience.0.bullets.1`).
 */
export function getFieldValue(resume: ResumeData, fieldPath: string, entryId?: string): string | null {
  if (!fieldPath || fieldPath.includes('__proto__') || fieldPath.includes('constructor') || fieldPath.includes('prototype')) {
    return null;
  }

  // Direct top-level summary
  if (fieldPath === 'summary') {
    return resume.summary;
  }

  // Handle entryId matching for bullets or entries
  if (entryId) {
    // Search experience bullets
    for (const exp of resume.experience) {
      if (exp.id === entryId) {
        return exp.title; // or general match
      }
      for (let i = 0; i < exp.bullets.length; i++) {
        const bulletId: string = `${exp.id}_b${i}`;
        if (bulletId === entryId || entryId === `b${i + 1}`) {
          return exp.bullets[i];
        }
      }
    }
    // Search projects
    for (const proj of resume.projectEntries) {
      if (proj.id === entryId) return proj.description;
      for (let i = 0; i < proj.bullets.length; i++) {
        if (`${proj.id}_b${i}` === entryId) return proj.bullets[i];
      }
    }
  }

  // Resolve path segments: e.g. "experience.0.bullets.1" or "experience[0].bullets[1]"
  const normalized = fieldPath.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalized.split('.');
  let current: any = resume;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }
    // Check if part is an array index or an entry ID
    if (Array.isArray(current) && isNaN(Number(part))) {
      current = current.find((item: any) => item && item.id === part);
    } else {
      current = current[part];
    }
  }

  return typeof current === 'string' ? current : null;
}

/**
 * Sets a field value in ResumeData defensively returning true if updated, false if path invalid.
 */
export function setFieldValue(resume: ResumeData, fieldPath: string, value: string, entryId?: string): boolean {
  if (!fieldPath || fieldPath.includes('__proto__') || fieldPath.includes('constructor') || fieldPath.includes('prototype')) {
    return false;
  }

  if (isProtectedFieldPath(fieldPath)) {
    return false;
  }

  if (fieldPath === 'summary') {
    resume.summary = value;
    return true;
  }

  // Try matching bullet by entryId first
  if (entryId) {
    for (const exp of resume.experience) {
      if (exp.id === entryId) {
        // can't change title if protected, but allow bullets
      }
      for (let i = 0; i < exp.bullets.length; i++) {
        const bulletId: string = `${exp.id}_b${i}`;
        if (bulletId === entryId || entryId === `b${i + 1}`) {
          exp.bullets[i] = value;
          return true;
        }
      }
    }
    for (const proj of resume.projectEntries) {
      if (proj.id === entryId) {
        proj.description = value;
        return true;
      }
      for (let i = 0; i < proj.bullets.length; i++) {
        if (`${proj.id}_b${i}` === entryId) {
          proj.bullets[i] = value;
          return true;
        }
      }
    }
  }

  const normalized = fieldPath.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalized.split('.');
  let current: any = resume;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    if (Array.isArray(current) && isNaN(Number(part))) {
      current = current.find((item: any) => item && item.id === part);
    } else {
      current = current[part];
    }
  }

  const lastPart = parts[parts.length - 1];
  if (current && typeof current === 'object' && lastPart in current) {
    current[lastPart] = value;
    return true;
  }

  return false;
}
