import type {
  EducationItem,
  ExperienceRole,
  ExtraSection,
  ProjectItem,
  TailoredResume,
} from "@/lib/resume/types";

const HEADINGS: Record<string, "summary" | "skills" | "experience" | "education" | "projects" | "extras"> = {
  summary: "summary",
  profile: "summary",
  about: "summary",
  skills: "skills",
  "technical skills": "skills",
  "core skills": "skills",
  technologies: "skills",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  employment: "experience",
  education: "education",
  projects: "projects",
  "selected projects": "projects",
  certifications: "extras",
  certificates: "extras",
  awards: "extras",
  publications: "extras",
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const DATE_HINT = /\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b/i;

type SectionKey = "preamble" | "summary" | "skills" | "experience" | "education" | "projects" | "extras";

type Block = {
  key: SectionKey;
  heading: string;
  lines: string[];
};

function headingKey(line: string): SectionKey | null {
  const normalized = line.toLowerCase().replace(/[:.]+$/g, "").trim();
  return HEADINGS[normalized] ?? null;
}

function isBullet(line: string): boolean {
  return /^(?:[-*•]|\d+[.)])\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^(?:[-*•]|\d+[.)])\s+/, "").trim();
}

function splitParts(line: string): string[] {
  return line
    .split(/\s+[|–—]\s+|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [{ key: "preamble", heading: "", lines: [] }];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const key = headingKey(line);
    if (key) {
      blocks.push({ key, heading: line.replace(/[:.]+$/g, "").trim(), lines: [] });
      continue;
    }
    blocks[blocks.length - 1]?.lines.push(line);
  }
  return blocks;
}

function linesFor(blocks: Block[], key: SectionKey): string[] {
  return blocks.filter((block) => block.key === key).flatMap((block) => block.lines);
}

function roleFromHeader(line: string): ExperienceRole {
  const parts = splitParts(line);
  let dates = "";
  const rest: string[] = [];
  for (const part of parts) {
    if (!dates && DATE_HINT.test(part)) dates = part;
    else rest.push(part);
  }
  const head = rest[0] ?? line;
  const comma = head.split(",").map((part) => part.trim()).filter(Boolean);
  const title = comma.length >= 2 ? comma[0] : head;
  const organization = comma.length >= 2 ? comma.slice(1).join(", ") : "";
  const location = rest.slice(1).join(" | ");
  return { title, organization, location, dates, bullets: [] };
}

function parseExperience(lines: string[]): ExperienceRole[] {
  const roles: ExperienceRole[] = [];
  let current: ExperienceRole | null = null;
  const push = () => {
    if (current && (current.title || current.organization || current.bullets.length)) {
      roles.push({ ...current, bullets: current.bullets.slice(0, 12) });
    }
  };
  for (const line of lines) {
    if (isBullet(line)) {
      current ??= { title: "Experience", organization: "", location: "", dates: "", bullets: [] };
      if (current.bullets.length < 12) current.bullets.push(stripBullet(line));
      continue;
    }
    push();
    current = roleFromHeader(line);
  }
  push();
  return roles.slice(0, 12);
}

function parseSkills(lines: string[]): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const line of lines) {
    for (const chunk of stripBullet(line).split(/[,;|/]/)) {
      const name = chunk.trim();
      if (!name || name.length > 40) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      skills.push(name);
      if (skills.length >= 40) return skills;
    }
  }
  return skills;
}

function parseEducation(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  for (const line of lines) {
    if (isBullet(line)) continue;
    const parts = splitParts(line);
    let dates = "";
    const rest: string[] = [];
    for (const part of parts) {
      if (!dates && DATE_HINT.test(part)) dates = part;
      else rest.push(part);
    }
    const head = rest.join(", ") || line;
    const comma = head.split(",").map((part) => part.trim()).filter(Boolean);
    items.push({
      credential: comma.length >= 2 ? comma[0] : head,
      school: comma.length >= 2 ? comma.slice(1).join(", ") : "",
      dates,
    });
    if (items.length >= 8) break;
  }
  return items;
}

function parseProjects(lines: string[]): ProjectItem[] {
  const projects: ProjectItem[] = [];
  let current: ProjectItem | null = null;
  const push = () => {
    if (current && (current.name || current.bullets.length)) {
      projects.push({ ...current, bullets: current.bullets.slice(0, 8) });
    }
  };
  for (const line of lines) {
    if (isBullet(line)) {
      current ??= { name: "Project", detail: "", bullets: [] };
      if (current.bullets.length < 8) current.bullets.push(stripBullet(line));
      continue;
    }
    push();
    const parts = splitParts(line);
    let detail = "";
    const rest: string[] = [];
    for (const part of parts) {
      if (!detail && DATE_HINT.test(part)) detail = part;
      else rest.push(part);
    }
    current = { name: rest.join(" - ") || line, detail, bullets: [] };
  }
  push();
  return projects.slice(0, 8);
}

function parseExtras(blocks: Block[]): ExtraSection[] {
  return blocks
    .filter((block) => block.key === "extras")
    .map((block) => ({
      heading: block.heading || "Additional",
      lines: block.lines.map((line) => (isBullet(line) ? stripBullet(line) : line)).slice(0, 12),
    }))
    .filter((section) => section.lines.length > 0)
    .slice(0, 6);
}

function contactLinesFrom(lines: string[]): string[] {
  return lines
    .filter((line) => EMAIL.test(line) || /\+?\d[\d\s().-]{7,}\d/.test(line) || /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})\b/i.test(line))
    .slice(0, 6);
}

function fromSections(blocks: Block[]): TailoredResume {
  const preamble = linesFor(blocks, "preamble");
  const nameLine = preamble[0];
  const fullName = nameLine && nameLine.length <= 80 && !EMAIL.test(nameLine) ? nameLine : "Resume";
  const second = preamble[1];
  const headline =
    second && second.length <= 120 && !EMAIL.test(second) && fullName !== "Resume" ? second : "";
  const contactSource = preamble.filter((line) => line !== fullName && line !== headline);
  const summary = linesFor(blocks, "summary").join("\n");
  return {
    fullName,
    headline,
    contactLines: contactLinesFrom(contactSource.length ? contactSource : preamble).concat(
      contactSource.filter((line) => !contactLinesFrom(preamble).includes(line)),
    ).slice(0, 6),
    summary,
    skills: parseSkills(linesFor(blocks, "skills")).map((name) => ({ name, highlighted: false })),
    experience: parseExperience(linesFor(blocks, "experience")),
    projects: parseProjects(linesFor(blocks, "projects")),
    education: parseEducation(linesFor(blocks, "education")),
    extras: parseExtras(blocks),
  };
}

function unstructured(text: string): TailoredResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const fullName = lines[0] && lines[0].length <= 80 && !EMAIL.test(lines[0]) ? lines[0] : "Resume";
  const rest = fullName === lines[0] ? lines.slice(1) : lines;
  const skillLine = rest.find((line) => (line.match(/,/g) ?? []).length >= 3 && !/[.!?]$/.test(line));
  const skills = skillLine ? parseSkills([skillLine]) : [];
  const body = rest.filter((line) => line !== skillLine);
  return {
    fullName,
    headline: "",
    contactLines: contactLinesFrom(lines),
    summary: "",
    skills: skills.map((name) => ({ name, highlighted: false })),
    experience: body.length
      ? [
          {
            title: "Experience",
            organization: "",
            location: "",
            dates: "",
            bullets: body.map((line) => stripBullet(line)).slice(0, 12),
          },
        ]
      : [],
    projects: [],
    education: [],
    extras: [],
  };
}

/** Turn pasted or extracted resume text into sections without adding facts. */
export function parseResume(text: string): TailoredResume {
  const blocks = splitBlocks(text);
  const hasSection = blocks.some((block) => block.key !== "preamble");
  return hasSection ? fromSections(blocks) : unstructured(text);
}
