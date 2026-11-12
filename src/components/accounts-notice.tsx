export const ACCOUNTS_NOT_CONFIGURED = "Accounts aren't configured yet";

export function AccountsNotice({ detail }: { detail?: string }) {
  return (
    <div role="status" className="rounded-3xl bg-highlight px-4 py-4 text-sm leading-6">
      <p className="font-semibold">{ACCOUNTS_NOT_CONFIGURED}</p>
      {detail ? <p className="mt-1">{detail}</p> : null}
    </div>
  );
}
