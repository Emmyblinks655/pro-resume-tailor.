import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { PageSize, TailoredResume } from "@/lib/resume/types";

const INK = rgb(0.11, 0.1, 0.08);
const MUTED = rgb(0.32, 0.29, 0.25);

const PAGE = {
  letter: { width: 612, height: 792 },
  a4: { width: 595.28, height: 841.89 },
} as const;

function pdfSafe(input: string): string {
  const replaced = input
    .replace(/\u00a0/g, " ")
    .replace(/[\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[•●∙·]/g, "-");
  let out = "";
  for (const char of replaced) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 10 || (code >= 32 && code <= 126) || "äöüÄÖÜßéèêëáàâãåæçíìîïñóòôõøúùûýÿÉÈÊËÁÀÂÃÅÆÇÍÌÎÏÑÓÒÔÕØÚÙÛÝ".includes(char)) {
      out += char;
    }
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  const pushWord = (word: string) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      return;
    }
    let piece = "";
    for (const char of word) {
      const next = piece + char;
      if (font.widthOfTextAtSize(next, size) > maxWidth && piece) {
        lines.push(piece);
        piece = char;
      } else {
        piece = next;
      }
    }
    current = piece;
  };
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      pushWord(word);
    } else if (!current && font.widthOfTextAtSize(word, size) > maxWidth) {
      pushWord(word);
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function renderResumePdf(resume: TailoredResume, pageSize: PageSize): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = PAGE[pageSize];
  const margin = 54;
  const maxWidth = width - margin * 2;
  let page: PDFPage = doc.addPage([width, height]);
  let y = height - margin;

  const newPage = () => {
    page = doc.addPage([width, height]);
    y = height - margin;
  };

  const ensure = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const drawLines = (text: string, font: PDFFont, size: number, color = INK, gap = 3) => {
    for (const paragraph of text.split(/\n+/)) {
      const safe = pdfSafe(paragraph);
      if (!safe) continue;
      for (const line of wrapLine(safe, font, size, maxWidth)) {
        ensure(size + gap);
        page.drawText(line, { x: margin, y: y - size, size, font, color });
        y -= size + gap;
      }
    }
  };

  const heading = (label: string) => {
    y -= 8;
    ensure(16);
    drawLines(label.toUpperCase(), bold, 11, INK, 4);
  };

  const roleLine = [resume.fullName, resume.headline].filter(Boolean).join("\n");
  drawLines(roleLine.split("\n")[0] || "Resume", bold, 18, INK, 4);
  if (resume.headline) drawLines(resume.headline, regular, 11, MUTED, 3);
  if (resume.contactLines.length) {
    drawLines(resume.contactLines.join(" | "), regular, 10, MUTED, 3);
  }

  const matched = resume.skills.filter((skill) => skill.highlighted).map((skill) => skill.name);
  const others = resume.skills.filter((skill) => !skill.highlighted).map((skill) => skill.name);
  if (resume.skills.length) {
    heading("Skills");
    if (matched.length) drawLines(`Relevant to this role: ${matched.join(", ")}`, bold, 11, INK, 3);
    if (others.length) drawLines(matched.length ? `Also listed: ${others.join(", ")}` : others.join(", "), regular, 11, INK, 3);
  }

  if (resume.summary) {
    heading("Summary");
    drawLines(resume.summary, regular, 11, INK, 3);
  }

  if (resume.experience.length) {
    heading("Experience");
    for (const role of resume.experience) {
      const title = [role.title, role.organization].filter(Boolean).join(", ");
      if (title) drawLines(title, bold, 11, INK, 2);
      const meta = [role.location, role.dates].filter(Boolean).join(" | ");
      if (meta) drawLines(meta, regular, 10, MUTED, 2);
      for (const bullet of role.bullets) drawLines(`- ${bullet}`, regular, 11, INK, 2);
      y -= 4;
    }
  }

  if (resume.projects.length) {
    heading("Projects");
    for (const project of resume.projects) {
      const title = [project.name, project.detail].filter(Boolean).join(" | ");
      if (title) drawLines(title, bold, 11, INK, 2);
      for (const bullet of project.bullets) drawLines(`- ${bullet}`, regular, 11, INK, 2);
      y -= 4;
    }
  }

  if (resume.education.length) {
    heading("Education");
    for (const item of resume.education) {
      const line = [item.credential, item.school, item.dates].filter(Boolean).join(", ");
      if (line) drawLines(line, regular, 11, INK, 3);
    }
  }

  for (const section of resume.extras) {
    heading(section.heading || "Additional");
    for (const line of section.lines) drawLines(`- ${line}`, regular, 11, INK, 2);
  }

  doc.setTitle(pdfSafe(resume.fullName || "Tailored resume"));
  doc.setAuthor(pdfSafe(resume.fullName || ""));
  return doc.save();
}

export function resumeFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "resume"}-tailored.pdf`;
}
