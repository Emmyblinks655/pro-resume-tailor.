import { emphasize } from "@/lib/resume/emphasize";
import { parseResume } from "@/lib/resume/parse";
import type { TailoredResume } from "@/lib/resume/types";

export type TailorMode = "gemini" | "anthropic" | "mock";

export type TailorInput = {
  resumeText: string;
  jobDescription: string;
};

export type AiStatus = {
  mode: TailorMode;
  modeLabel: string;
  model: string | null;
  requestedProvider: "gemini" | "anthropic" | "mock";
};

export type TailorSuccess = AiStatus & {
  resume: TailoredResume;
  warnings: string[];
};

/** Customer-facing label. The mode field stays "mock" for the server fallback. */
export const MOCK_LABEL = "Tailored from your resume";

export function tailorLocally(input: TailorInput): TailoredResume {
  return emphasize(parseResume(input.resumeText), input.jobDescription);
}

export function readRequestedProvider(): AiStatus["requestedProvider"] {
  const value = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (value === "anthropic" || value === "mock" || value === "gemini") return value;
  return "gemini";
}
