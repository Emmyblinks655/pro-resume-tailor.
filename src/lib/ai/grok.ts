import OpenAI from "openai";

import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { TailorInput } from "@/lib/ai/types";
import { groundResume } from "@/lib/resume/ground";
import { parseModelJson, parseTailoredResume } from "@/lib/resume/schema";
import type { TailoredResume } from "@/lib/resume/types";

const XAI_BASE_URL = "https://api.x.ai/v1";

const RESUME_SHAPE = `{
  "fullName": "string",
  "headline": "string",
  "contactLines": ["string"],
  "summary": "string",
  "skills": [{ "name": "string", "highlighted": false }],
  "experience": [{ "title": "string", "organization": "string", "location": "string", "dates": "string", "bullets": ["string"] }],
  "projects": [{ "name": "string", "detail": "string", "bullets": ["string"] }],
  "education": [{ "school": "string", "credential": "string", "dates": "string" }],
  "extras": [{ "heading": "string", "lines": ["string"] }]
}`;

export function grokModel(): string {
  return process.env.XAI_MODEL?.trim() || "grok-4.3";
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
      return "";
    })
    .join("")
    .trim();
}

export async function tailorWithGrok(input: TailorInput): Promise<{
  resume: TailoredResume;
  warnings: string[];
}> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("The tailor could not finish.");
  }
  const client = new OpenAI({
    apiKey,
    baseURL: XAI_BASE_URL,
    timeout: 55_000,
  });
  const completion = await client.chat.completions.create({
    model: grokModel(),
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${buildUserPrompt(input.resumeText, input.jobDescription)}

Return a JSON object with exactly these keys:
${RESUME_SHAPE}`,
      },
    ],
  });
  const choice = completion.choices[0];
  if (choice?.finish_reason === "length") {
    throw new Error("The tailor did not return a readable resume.");
  }
  const text = messageText(choice?.message?.content);
  if (!text) {
    throw new Error("The tailor returned an empty resume.");
  }
  let parsed: unknown;
  try {
    parsed = parseModelJson(text);
  } catch {
    throw new Error("The tailor did not return a readable resume.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The tailor did not return a readable resume.");
  }
  return groundResume(parseTailoredResume(parsed), input.resumeText, input.jobDescription);
}
