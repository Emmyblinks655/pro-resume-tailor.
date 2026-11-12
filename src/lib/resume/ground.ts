import { emphasize } from "@/lib/resume/emphasize";
import { parseResume } from "@/lib/resume/parse";
import type { ExperienceRole, TailoredResume } from "@/lib/resume/types";
import { hasInventedNumber, tokens, yearsIn } from "@/lib/resume/text";

export type GroundedResume = {
  resume: TailoredResume;
  warnings: string[];
};

function includes(source: string, value: string): boolean {
  const needle = value.trim().toLowerCase();
  return needle.length > 1 && source.toLowerCase().includes(needle);
}

function groundedProse(text: string, source: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (hasInventedNumber(trimmed, source)) return false;
  if (includes(source, trimmed)) return true;
  const significant = tokens(trimmed).filter((token) => token.length >= 4);
  if (!significant.length) return false;
  const sourceTokens = new Set(tokens(source));
  const hits = significant.filter((token) => sourceTokens.has(token)).length;
  return hits / significant.length >= 0.4;
}

function groundedBullet(bullet: string, source: string): boolean {
  const trimmed = bullet.trim();
  if (!trimmed || hasInventedNumber(trimmed, source)) return false;
  return groundedProse(trimmed, source);
}

function datesOk(dates: string, source: string): boolean {
  if (!dates.trim()) return true;
  const years = yearsIn(dates);
  if (!years.length) return includes(source, dates);
  return years.every((year) => source.includes(year));
}

function matchRole(baseline: TailoredResume, role: ExperienceRole): ExperienceRole | undefined {
  const org = role.organization.trim().toLowerCase();
  const title = role.title.trim().toLowerCase();
  return baseline.experience.find(
    (item) =>
      (org && item.organization.toLowerCase() === org) || (title && item.title.toLowerCase() === title),
  );
}

/**
 * Drop anything the model added that is not supported by the source resume.
 * Rephrased bullets stay when they still share the source's facts and numbers.
 */
export function groundResume(model: TailoredResume, sourceText: string, jobDescription: string): GroundedResume {
  const baseline = emphasize(parseResume(sourceText), jobDescription);
  const warnings = new Set<string>();

  const fullName = includes(sourceText, model.fullName) ? model.fullName.trim() : baseline.fullName;
  if (model.fullName.trim() && fullName !== model.fullName.trim()) {
    warnings.add("The name was kept from your resume.");
  }

  const headline = groundedProse(model.headline, sourceText) ? model.headline.trim() : baseline.headline;
  const summary = groundedProse(model.summary, sourceText) ? model.summary.trim() : baseline.summary;
  if (model.summary.trim() && summary !== model.summary.trim()) {
    warnings.add("The summary stayed closer to your original wording.");
  }

  const contactLines = model.contactLines.filter((line) => includes(sourceText, line));
  const seenSkills = new Set<string>();
  const skills = [...model.skills, ...baseline.skills].flatMap((skill) => {
    const name = skill.name.trim();
    const key = name.toLowerCase();
    if (!name || !includes(sourceText, name) || seenSkills.has(key)) return [];
    seenSkills.add(key);
    return [skill];
  });

  let droppedBullet = false;
  const experience = model.experience.flatMap((role) => {
    const known = matchRole(baseline, role);
    const title = includes(sourceText, role.title) ? role.title.trim() : (known?.title ?? "");
    const organization = includes(sourceText, role.organization)
      ? role.organization.trim()
      : (known?.organization ?? "");
    if (!title && !organization) {
      warnings.add("A role was left out because it was not in your resume.");
      return [];
    }
    const bullets = role.bullets.filter((bullet) => groundedBullet(bullet, sourceText));
    if (bullets.length < role.bullets.length) droppedBullet = true;
    return [
      {
        title,
        organization,
        location: includes(sourceText, role.location) ? role.location.trim() : (known?.location ?? ""),
        dates: datesOk(role.dates, sourceText) ? role.dates.trim() : (known?.dates ?? ""),
        bullets: bullets.length ? bullets : (known?.bullets ?? []),
      },
    ];
  });

  if (droppedBullet) {
    warnings.add("Some bullets were removed because they added facts that were not in your resume.");
  }

  const projects = model.projects.flatMap((project) => {
    if (!includes(sourceText, project.name)) return [];
    const bullets = project.bullets.filter((bullet) => groundedBullet(bullet, sourceText));
    return [
      {
        name: project.name.trim(),
        detail: includes(sourceText, project.detail) || datesOk(project.detail, sourceText) ? project.detail.trim() : "",
        bullets,
      },
    ];
  });

  const education = model.education.flatMap((item) => {
    const schoolOk = includes(sourceText, item.school);
    const credentialOk = includes(sourceText, item.credential);
    if (!schoolOk && !credentialOk) return [];
    return [
      {
        school: schoolOk ? item.school.trim() : "",
        credential: credentialOk ? item.credential.trim() : "",
        dates: datesOk(item.dates, sourceText) ? item.dates.trim() : "",
      },
    ];
  });

  const extras = model.extras.flatMap((section) => {
    const lines = section.lines.filter((line) => groundedBullet(line, sourceText));
    if (!lines.length) return [];
    const heading = includes(sourceText, section.heading) ? section.heading.trim() : "Additional";
    return [{ heading, lines }];
  });

  const drafted: TailoredResume = {
    fullName,
    headline,
    contactLines: contactLines.length ? contactLines : baseline.contactLines,
    summary,
    skills: skills.length ? skills : baseline.skills,
    experience: experience.length ? experience : baseline.experience,
    projects: projects.length ? projects : baseline.projects,
    education: education.length ? education : baseline.education,
    extras: extras.length ? extras : baseline.extras,
  };

  if (!experience.length && baseline.experience.length) {
    warnings.add("Roles were kept from your resume because the model output could not be checked.");
  }

  return {
    resume: emphasize(drafted, jobDescription),
    warnings: [...warnings].slice(0, 4),
  };
}
