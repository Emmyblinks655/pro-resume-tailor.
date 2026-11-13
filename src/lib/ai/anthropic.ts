import Anthropic from "@anthropic-ai/sdk";

import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { TailorInput } from "@/lib/ai/types";
import { groundResume } from "@/lib/resume/ground";
import { parseModelJson, parseTailoredResume } from "@/lib/resume/schema";
import type { TailoredResume } from "@/lib/resume/types";

export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
}

export async function tailorWithAnthropic(input: TailorInput): Promise<{
  resume: TailoredResume;
  warnings: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("The tailor could not finish.");
  }
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: anthropicModel(),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input.resumeText, input.jobDescription) }],
  });
  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("The tailor returned an empty resume.");
  }
  let parsed: unknown;
  try {
    parsed = parseModelJson(text);
  } catch {
    throw new Error("The tailor did not return a readable resume.");
  }
  return groundResume(parseTailoredResume(parsed), input.resumeText, input.jobDescription);
}
