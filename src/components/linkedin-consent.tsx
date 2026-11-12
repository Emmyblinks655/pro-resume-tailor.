import { connection } from "next/server";

import { loadLinkedInSettings } from "@/lib/linkedin/status";
import { linkedInNotice, readNoticeCode } from "@/lib/linkedin/notices";
import { LINKEDIN_NOT_SHARED, LINKEDIN_SCOPES, LINKEDIN_USES } from "@/lib/linkedin/scopes";

const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 text-base font-semibold";

export async function LinkedInConsent({
  searchParams,
}: {
  searchParams: Promise<{ linkedin?: string | string[] }>;
}) {
  await connection();
  const [params, settings] = await Promise.all([searchParams, loadLinkedInSettings()]);
  const notice = linkedInNotice(readNoticeCode(params.linkedin));

  return (
    <div className="mt-6 space-y-4">
      {notice ? (
        <p role="status" className="rounded-3xl bg-highlight px-4 py-3 text-sm leading-6">
          {notice}
        </p>
      ) : null}

      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">What LinkedIn will share</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6">
          {LINKEDIN_SCOPES.map((item) => (
            <li key={item.scope}>
              <span className="font-semibold">{item.scope}</span>
              <span className="text-ink-soft"> — {item.reads}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">What LinkedIn will not share</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          {LINKEDIN_NOT_SHARED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Sign In with LinkedIn using OpenID Connect does not give work history, endorsements, or network
          data to ordinary apps. This app will not pretend to read them. Richer LinkedIn data would need a
          partner product and LinkedIn’s approval. New scopes are added only in the server scope list, which
          is the list printed above.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">Why this app asks</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          {LINKEDIN_USES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {settings.canStart ? (
        <form action="/api/auth/linkedin/start" method="post">
          <button type="submit" className={`${buttonClass} bg-copper text-white`}>
            Continue to LinkedIn
          </button>
        </form>
      ) : (
        <button type="button" disabled className={`${buttonClass} bg-ink text-paper disabled:opacity-60`}>
          {settings.buttonLabel}
        </button>
      )}
      <p className="text-sm leading-6 text-ink-soft">
        {settings.canStart
          ? "Continuing sends you to LinkedIn. The access token is exchanged on the server and stored encrypted. It is not placed in page JavaScript or localStorage."
          : "Nothing is sent to LinkedIn until this site has credentials and a token encryption key."}
      </p>
    </div>
  );
}
