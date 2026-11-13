import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { TailorInput } from "@/lib/ai/types";
import { groundResume } from "@/lib/resume/ground";
import { parseModelJson, parseTailoredResume, RESUME_JSON_SCHEMA } from "@/lib/resume/schema";
import type { TailoredResume } from "@/lib/resume/types";

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

async function generate(ai: GoogleGenAI, input: TailorInput, withThinking: boolean): Promise<string> {
  const response = await ai.models.generateContent({
    model: geminiModel(),
    contents: buildUserPrompt(input.resumeText, input.jobDescription),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: RESUME_JSON_SCHEMA,
      maxOutputTokens: 4096,
      ...(withThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
    },
  });
  return response.text ?? "";
}

export async function tailorWithGemini(input: TailorInput): Promise<{
  resume: TailoredResume;
  warnings: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("The tailor could not finish.");
  }
  const ai = new GoogleGenAI({ apiKey });
  let text = "";
  try {
    text = await generate(ai, input, true);
  } catch (error) {
    console.error("Gemini request failed, retrying without a thinking level.", error);
    text = await generate(ai, input, false);
  }
  if (!text.trim()) {
    throw new Error("The tailor returned an empty resume.");
  }
  let parsed: unknown;
  try {
    parsed = parseModelJson(text);
  } catch {
    throw new Error("The tailor did not return a readable resume.");
  }
  const resume = parseTailoredResume(parsed);
  return groundResume(resume, input.resumeText, input.jobDescription);
}
