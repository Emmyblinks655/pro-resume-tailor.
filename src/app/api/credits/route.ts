import { getAiStatus } from "@/lib/ai";
import { getLocalCredits } from "@/lib/credits/local-cookie";

export async function GET() {
  const [credits, ai] = await Promise.all([getLocalCredits(), Promise.resolve(getAiStatus())]);
  return Response.json({ credits, ai });
}
