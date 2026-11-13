import { tailorWithAnthropic, anthropicModel } from "@/lib/ai/anthropic";
import { geminiModel, tailorWithGemini } from "@/lib/ai/gemini";
import { MOCK_LABEL, readRequestedProvider, tailorLocally, type AiStatus, type TailorInput, type TailorSuccess } from "@/lib/ai/types";

export function getAiStatus(): AiStatus {
  const requestedProvider = readRequestedProvider();
  if (requestedProvider === "mock") {
    return { mode: "mock", modeLabel: MOCK_LABEL, model: null, requestedProvider };
  }
  if (requestedProvider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return { mode: "mock", modeLabel: MOCK_LABEL, model: null, requestedProvider };
    }
    return {
      mode: "anthropic",
      modeLabel: "Tailored from your resume",
      model: anthropicModel(),
      requestedProvider,
    };
  }
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return { mode: "mock", modeLabel: MOCK_LABEL, model: null, requestedProvider };
  }
  return {
    mode: "gemini",
    modeLabel: "Tailored from your resume",
    model: geminiModel(),
    requestedProvider,
  };
}

export async function tailorResume(input: TailorInput): Promise<TailorSuccess> {
  const status = getAiStatus();
  if (status.mode === "mock") {
    return { ...status, resume: tailorLocally(input), warnings: [] };
  }
  try {
    const drafted =
      status.mode === "anthropic" ? await tailorWithAnthropic(input) : await tailorWithGemini(input);
    return { ...status, ...drafted };
  } catch (error) {
    console.error("Resume tailor failed.", error);
    throw new Error("The tailor could not finish. Nothing you did not write was added. Please try again.");
  }
}
