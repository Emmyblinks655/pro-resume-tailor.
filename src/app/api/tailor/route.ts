import { getAiStatus, tailorResume } from "@/lib/ai";
import { consumeLocalCredit, refundLocalCredit } from "@/lib/credits/local-cookie";
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

  const spent = await consumeLocalCredit();
  if (!spent.ok) {
    return Response.json(
      {
        error: "No preview credits left in this browser. Checkout is not live yet, so a pack cannot be bought from here.",
        credits: spent.balance,
      },
      { status: 402 },
    );
  }

  try {
    const result = await tailorResume(parsed.data);
    return Response.json({ ...result, credits: spent.balance });
  } catch (error) {
    const credits = await refundLocalCredit();
    const message =
      error instanceof Error
        ? error.message
        : "The tailor could not finish. Your preview credit was returned.";
    return Response.json({ error: message, credits }, { status: 502 });
  }
}

export async function GET() {
  return Response.json(getAiStatus());
}
