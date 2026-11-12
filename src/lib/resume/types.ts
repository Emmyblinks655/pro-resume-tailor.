export type HighlightedSkill = {
  name: string;
  highlighted: boolean;
};

export type ExperienceRole = {
  title: string;
  organization: string;
  location: string;
  dates: string;
  bullets: string[];
};

export type ProjectItem = {
  name: string;
  detail: string;
  bullets: string[];
};

export type EducationItem = {
  school: string;
  credential: string;
  dates: string;
};

export type ExtraSection = {
  heading: string;
  lines: string[];
};

/** Structured resume the preview and the ATS PDF both render. */
export type TailoredResume = {
  fullName: string;
  headline: string;
  contactLines: string[];
  summary: string;
  skills: HighlightedSkill[];
  experience: ExperienceRole[];
  projects: ProjectItem[];
  education: EducationItem[];
  extras: ExtraSection[];
};

export type PageSize = "letter" | "a4";
