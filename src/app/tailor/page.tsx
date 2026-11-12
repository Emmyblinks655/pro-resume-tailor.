import type { Metadata } from "next";

import { TailorStudio } from "@/components/tailor-studio";

export const metadata: Metadata = {
  title: "Tailor a resume",
  description: "Paste a resume and a job description, then download an ATS-safe PDF.",
};

export default function TailorPage() {
  return <TailorStudio />;
}
