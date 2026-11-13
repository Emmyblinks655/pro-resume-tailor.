import { getAiStatus, tailorResume } from "@/lib/ai";
import { consumeCredit, refundCredit } from "@/lib/credits";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";
import { z } from "zod";

const requestSchema = z.object({
  resumeText: z.string().min(40).max(20000),
  jobDescription: z.string().min(40).max(20000),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send the resume and the job description as JSON." }, { status: 400 });
  }
  const record = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const parsed = requestSchema.safeParse({
    resumeText: typeof record.resumeText === "string" ? record.resumeText.trim() : "",
    jobDescription: typeof record.jobDescription === "string" ? record.jobDescription.trim() : "",
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Add a fuller resume and job description. Each needs at least a few lines." },
      { status: 400 },
    );
  }

  if (accountsConfigured()) {
    const account = await currentAccount();
    if (!account) {
      return Response.json({ error: "Log in to tailor a resume." }, { status: 401 });
    }
  }

  const spent = await consumeCredit();
  if (!spent.ok) {
    return Response.json(
      {
        error: "No tailorings left. Get 5 more for $9.",
        credits: spent.balance,
      },
      { status: 402 },
    );
  }

  try {
    const result = await tailorResume(parsed.data);
    return Response.json({ ...result, credits: spent.balance });
  } catch (error) {
    const credits = await refundCredit();
    const raw = error instanceof Error ? error.message : "";
    const leaked = /api[_ -]?key|gemini|claude|anthropic|google|mock|configured|supabase/i.test(raw);
    const message = leaked || !raw ? "The tailor could not finish. Please try again." : raw;
    return Response.json({ error: message, credits }, { status: 502 });
  }
}

export async function GET() {
  return Response.json(getAiStatus());
}
