import { getAiStatus } from "@/lib/ai";
import { readCreditBalance } from "@/lib/credits";

export async function GET() {
  const [credits, ai] = await Promise.all([readCreditBalance(), Promise.resolve(getAiStatus())]);
  return Response.json({ credits, ai });
}
