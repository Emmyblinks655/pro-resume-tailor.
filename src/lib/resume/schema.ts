import { z } from "zod";

import type {
  EducationItem,
  ExperienceRole,
  ExtraSection,
  HighlightedSkill,
  ProjectItem,
  TailoredResume,
} from "@/lib/resume/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function strList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function skills(value: unknown): HighlightedSkill[] {
  if (!Array.isArray(value)) return [];
  const parsed: HighlightedSkill[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const name = str(item, 80);
      if (name) parsed.push({ name, highlighted: false });
      continue;
    }
    const record = asRecord(item);
    const name = str(record.name, 80);
    if (name) parsed.push({ name, highlighted: record.highlighted === true });
  }
  return parsed.slice(0, 40);
}

function experience(value: unknown): ExperienceRole[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item) => {
    const record = asRecord(item);
    return {
      title: str(record.title, 160),
      organization: str(record.organization, 160),
      location: str(record.location, 120),
      dates: str(record.dates, 80),
      bullets: strList(record.bullets, 12, 500),
    };
  });
}

function projects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    return {
      name: str(record.name, 160),
      detail: str(record.detail, 160),
      bullets: strList(record.bullets, 8, 500),
    };
  });
}

function education(value: unknown): EducationItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => {
    const record = asRecord(item);
    return {
      school: str(record.school, 160),
      credential: str(record.credential, 200),
      dates: str(record.dates, 80),
    };
  });
}

function extras(value: unknown): ExtraSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .map((item) => {
      const record = asRecord(item);
      return { heading: str(record.heading, 80), lines: strList(record.lines, 12, 300) };
    })
    .filter((section) => section.heading || section.lines.length);
}

const tailoredResumeSchema = z.object({
  fullName: z.string().max(120),
  headline: z.string().max(200),
  contactLines: z.array(z.string().max(200)).max(8),
  summary: z.string().max(2000),
  skills: z.array(z.object({ name: z.string().min(1).max(80), highlighted: z.boolean() })).max(40),
  experience: z
    .array(
      z.object({
        title: z.string().max(160),
        organization: z.string().max(160),
        location: z.string().max(120),
        dates: z.string().max(80),
        bullets: z.array(z.string().max(500)).max(12),
      }),
    )
    .max(12),
  projects: z
    .array(
      z.object({
        name: z.string().max(160),
        detail: z.string().max(160),
        bullets: z.array(z.string().max(500)).max(8),
      }),
    )
    .max(8),
  education: z
    .array(
      z.object({
        school: z.string().max(160),
        credential: z.string().max(200),
        dates: z.string().max(80),
      }),
    )
    .max(8),
  extras: z
    .array(z.object({ heading: z.string().max(80), lines: z.array(z.string().max(300)).max(12) }))
    .max(6),
});

export const RESUME_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "fullName",
    "headline",
    "contactLines",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "extras",
  ],
  properties: {
    fullName: { type: "string" },
    headline: { type: "string" },
    contactLines: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "highlighted"],
        properties: {
          name: { type: "string" },
          highlighted: { type: "boolean" },
        },
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "organization", "location", "dates", "bullets"],
        properties: {
          title: { type: "string" },
          organization: { type: "string" },
          location: { type: "string" },
          dates: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "detail", "bullets"],
        properties: {
          name: { type: "string" },
          detail: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["school", "credential", "dates"],
        properties: {
          school: { type: "string" },
          credential: { type: "string" },
          dates: { type: "string" },
        },
      },
    },
    extras: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "lines"],
        properties: {
          heading: { type: "string" },
          lines: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export function parseTailoredResume(input: unknown): TailoredResume {
  const record = asRecord(input);
  const coerced = {
    fullName: str(record.fullName, 120),
    headline: str(record.headline, 200),
    contactLines: strList(record.contactLines, 8, 200),
    summary: typeof record.summary === "string" ? record.summary.trim().slice(0, 2000) : "",
    skills: skills(record.skills),
    experience: experience(record.experience),
    projects: projects(record.projects),
    education: education(record.education),
    extras: extras(record.extras),
  };
  const parsed = tailoredResumeSchema.safeParse(coerced);
  if (!parsed.success) {
    throw new Error("The model returned a resume we could not read.");
  }
  return parsed.data;
}

export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1));
    throw new Error("The tailor did not return a readable resume.");
  }
}
