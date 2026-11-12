import type { TailoredResume } from "@/lib/resume/types";
import { scoreText, tokens } from "@/lib/resume/text";

function skillMatches(name: string, jobDescription: string, jdTokens: Set<string>): boolean {
  const normalized = name.trim().toLowerCase();
  if (normalized.length < 2) return false;
  if (jobDescription.toLowerCase().includes(normalized)) return true;
  const parts = tokens(name);
  return parts.length > 0 && parts.every((part) => jdTokens.has(part));
}

function sortByRelevance(lines: string[], jdTokens: Set<string>): string[] {
  return lines
    .map((line, index) => ({ line, index, score: scoreText(line, jdTokens) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.line);
}

/**
 * Reorder and flag material that already exists. Does not rewrite or add text.
 * This is the whole of mock mode, and the baseline live output is checked against.
 */
export function emphasize(resume: TailoredResume, jobDescription: string): TailoredResume {
  const jdTokens = new Set(tokens(jobDescription));
  const skills = resume.skills
    .map((skill, index) => ({
      skill: {
        name: skill.name,
        highlighted: skillMatches(skill.name, jobDescription, jdTokens),
      },
      index,
    }))
    .sort((a, b) => Number(b.skill.highlighted) - Number(a.skill.highlighted) || a.index - b.index)
    .map((item) => item.skill);

  return {
    ...resume,
    skills,
    experience: resume.experience.map((role) => ({
      ...role,
      bullets: sortByRelevance(role.bullets, jdTokens),
    })),
    projects: resume.projects.map((project) => ({
      ...project,
      bullets: sortByRelevance(project.bullets, jdTokens),
    })),
  };
}
