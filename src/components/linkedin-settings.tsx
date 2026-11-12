import Link from "next/link";

import { linkedInNotice, readNoticeCode } from "@/lib/linkedin/notices";
import { loadLinkedInSettings } from "@/lib/linkedin/status";

const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 text-base font-semibold";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC`;
}

export async function LinkedInSettings({
  searchParams,
}: {
  searchParams: Promise<{ linkedin?: string | string[] }>;
}) {
  const [params, settings] = await Promise.all([searchParams, loadLinkedInSettings()]);
  const notice = linkedInNotice(readNoticeCode(params.linkedin));
  const connection = settings.connection;
  const profile = connection.state === "connected" || connection.state === "locked" ? connection.profile : null;

  return (
    <div className="mt-6 space-y-4">
      {notice ? (
        <p role="status" className="rounded-3xl bg-highlight px-4 py-3 text-sm leading-6">
          {notice}
        </p>
      ) : null}

      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">LinkedIn</h2>
        {connection.state === "connected" && profile ? (
          <div className="mt-4 flex gap-3">
            {profile.pictureUrl ? (
              // Member photo hosts vary, so this stays a plain image rather than a fixed remote pattern.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.pictureUrl}
                alt={profile.name ? `${profile.name}'s LinkedIn profile photo` : "LinkedIn profile photo"}
                width={64}
                height={64}
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-full border border-line object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-lg font-semibold">{profile.name ?? "Name was not included"}</p>
              <p className="text-sm leading-6 text-ink-soft">{profile.email ?? "Email was not included"}</p>
              <p className="mt-1 text-xs leading-5 break-all text-ink-soft">Member ID {profile.memberId}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            {connection.state === "unreadable"
              ? "A LinkedIn cookie is present, but it could not be decrypted."
              : connection.state === "error"
                ? "The connection store could not be read."
                : "No LinkedIn account is connected."}
          </p>
        )}
        {connection.state === "locked" ? (
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            The saved profile is shown above. The access token could not be decrypted, so disconnect can
            delete it here but cannot ask LinkedIn to revoke it.
          </p>
        ) : null}
        {connection.state === "connected" ? (
          <dl className="mt-4 space-y-2 text-sm leading-6">
            <div>
              <dt className="font-semibold">Connected</dt>
              <dd className="text-ink-soft">{formatWhen(connection.connectedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Scopes</dt>
              <dd className="text-ink-soft">{connection.scopes}</dd>
            </div>
          </dl>
        ) : null}
        {connection.state === "connected" && connection.pictureOmitted ? (
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            The photo URL was too long for the encrypted cookie, so it was not stored.
          </p>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-ink-soft">Storage: {settings.storageLabel}</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          This sign-in does not include work history, endorsements, or your network.
        </p>
        {settings.canStart ? (
          <Link
            href="/settings/linkedin"
            className={`${buttonClass} mt-4 bg-copper text-white`}
          >
            {connection.state === "connected" ? "Review LinkedIn access" : "Connect LinkedIn"}
          </Link>
        ) : (
          <button type="button" disabled className={`${buttonClass} mt-4 bg-ink text-paper disabled:opacity-60`}>
            {settings.buttonLabel}
          </button>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">Disconnect</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Deletes the saved name, email, photo, member ID, and access token from this app, then asks
          LinkedIn to revoke the token when LinkedIn supports that.
        </p>
        {settings.canDisconnect ? (
          <form action="/api/auth/linkedin/disconnect" method="post" className="mt-4">
            <button type="submit" className={`${buttonClass} border border-ink bg-card text-ink`}>
              Disconnect LinkedIn
            </button>
          </form>
        ) : (
          <>
            <button type="button" disabled className={`${buttonClass} mt-4 border border-line bg-card text-ink disabled:opacity-60`}>
              Disconnect LinkedIn
            </button>
            <p className="mt-3 text-sm leading-6 text-ink-soft">No LinkedIn account is connected.</p>
          </>
        )}
      </section>
    </div>
  );
}
