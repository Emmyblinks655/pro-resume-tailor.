import type { TailoredResume } from "@/lib/resume/types";

export function ResumePreview({ resume }: { resume: TailoredResume }) {
  const matched = resume.skills.filter((skill) => skill.highlighted);
  const others = resume.skills.filter((skill) => !skill.highlighted);

  return (
    <article className="rounded-3xl border border-line bg-card p-4 text-ink shadow-sm sm:p-6">
      <header>
        <h3 className="font-display text-2xl leading-tight">{resume.fullName || "Resume"}</h3>
        {resume.headline ? <p className="mt-1 text-sm text-ink-soft">{resume.headline}</p> : null}
        {resume.contactLines.length ? (
          <p className="mt-2 text-sm leading-6 text-ink-soft">{resume.contactLines.join(" | ")}</p>
        ) : null}
      </header>

      {resume.skills.length ? (
        <section className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">Skills</h4>
          {matched.length ? (
            <p className="mt-2 text-sm leading-6">
              <span className="font-semibold">Brought forward for this job: </span>
              {matched.map((skill) => (
                <span key={skill.name}>
                  <span className="mr-1 mb-1 inline-flex rounded-full bg-highlight px-2 py-0.5 font-semibold">
                    {skill.name}
                  </span>{" "}
                </span>
              ))}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">None of the listed skills appear in the job description.</p>
          )}
          {others.length ? (
            <p className="mt-2 text-sm leading-6 text-ink-soft">Also listed: {others.map((skill) => skill.name).join(", ")}</p>
          ) : null}
        </section>
      ) : null}

      {resume.summary ? (
        <section className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">Summary</h4>
          <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{resume.summary}</p>
        </section>
      ) : null}

      {resume.experience.length ? (
        <section className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">Experience</h4>
          <div className="mt-2 space-y-4">
            {resume.experience.map((role) => (
              <div key={`${role.title}-${role.organization}-${role.dates}`}>
                <p className="text-sm font-semibold">
                  {[role.title, role.organization].filter(Boolean).join(", ")}
                </p>
                <p className="text-xs text-ink-soft">{[role.location, role.dates].filter(Boolean).join(" | ")}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                  {role.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.projects.length ? (
        <section className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">Projects</h4>
          <div className="mt-2 space-y-3">
            {resume.projects.map((project) => (
              <div key={project.name}>
                <p className="text-sm font-semibold">
                  {[project.name, project.detail].filter(Boolean).join(" | ")}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                  {project.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {resume.education.length ? (
        <section className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">Education</h4>
          <ul className="mt-2 space-y-1 text-sm leading-6">
            {resume.education.map((item) => (
              <li key={`${item.credential}-${item.school}`}>
                {[item.credential, item.school, item.dates].filter(Boolean).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resume.extras.map((section) => (
        <section key={section.heading} className="mt-5">
          <h4 className="text-xs font-semibold tracking-[0.14em] text-copper uppercase">{section.heading}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {section.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
