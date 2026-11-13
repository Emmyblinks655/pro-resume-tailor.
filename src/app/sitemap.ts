import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

const PUBLIC_PATHS = ["/", "/pricing", "/jobs", "/tailor", "/login", "/signup", "/privacy", "/terms", "/refund"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? origin : `${origin}${path}`,
  }));
}
