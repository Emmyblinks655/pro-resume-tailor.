import { extractResumeFile } from "@/lib/extract-resume";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Upload a PDF or DOCX file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Upload a PDF or DOCX file." }, { status: 400 });
  }
  try {
    const text = await extractResumeFile(file);
    if (!text) {
      return Response.json(
        { error: "No text found in that file. Paste the resume instead." },
        { status: 422 },
      );
    }
    return Response.json({ text, filename: file.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that file.";
    return Response.json({ error: message }, { status: 400 });
  }
}
