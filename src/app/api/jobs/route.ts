import { NextRequest } from "next/server";

import { JOBS_REVALIDATE_SECONDS } from "@/lib/jobs/http";
import { parseJobQuery } from "@/lib/jobs/filter";
import { searchJobs } from "@/lib/jobs/search";

export async function GET(request: NextRequest) {
  const query = parseJobQuery(request.nextUrl.searchParams);
  try {
    const result = await searchJobs(query);
    return Response.json(result, {
      headers: {
        "Cache-Control": `public, s-maxage=${JOBS_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
      },
    });
  } catch {
    return Response.json(
      { jobs: [], query, sources: [], error: "Job sources are unavailable." },
      { status: 502 },
    );
  }
}
