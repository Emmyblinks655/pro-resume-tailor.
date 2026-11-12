const MAX_BYTES = 4 * 1024 * 1024;

export async function extractResumeFile(file: File): Promise<string> {
  if (file.size <= 0) {
    throw new Error("That file is empty.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That file is too large. The maximum size is 4 MB.");
  }
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (!isPdf && !isDocx) {
    throw new Error("Upload a PDF or DOCX file, or paste the resume text instead.");
  }

  if (isPdf) {
    const { extractText } = await import("unpdf");
    const result = await extractText(bytes, { mergePages: true });
    return cleanup(result.text);
  }

  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return cleanup(result.value);
}

function cleanup(text: string): string {
  return text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim().slice(0, 20000);
}
