import { renderResumePdf, resumeFilename } from "@/lib/pdf/render";
import { parseTailoredResume } from "@/lib/resume/schema";
import type { PageSize } from "@/lib/resume/types";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send the tailored resume as JSON." }, { status: 400 });
  }
  const record = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const pageSize: PageSize = record.pageSize === "a4" ? "a4" : "letter";
  try {
    const resume = parseTailoredResume(record.resume);
    const pdf = await renderResumePdf(resume, pageSize);
    const filename = resumeFilename(resume.fullName);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF render failed.", error);
    return Response.json({ error: "Could not build the PDF from that resume." }, { status: 400 });
  }
}
