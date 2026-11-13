"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { BrandLink } from "@/components/logo";
import { logout } from "@/lib/auth/actions";

const links = [
  { href: "/jobs", label: "Jobs" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

function MenuGlyph({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AuthLinks({
  account,
  pending,
  onNavigate,
  stacked,
}: {
  account: { email: string | null } | null;
  pending: boolean;
  onNavigate?: () => void;
  stacked: boolean;
}) {
  const itemClass = stacked
    ? "flex min-h-14 items-center rounded-2xl px-3 text-lg font-semibold"
    : "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-highlight hover:text-ink";

  if (pending) {
    return <span className={stacked ? "h-14 rounded-2xl bg-highlight" : "h-11 w-24 rounded-full bg-highlight"} />;
  }

  if (account) {
    return (
      <>
        <Link href="/dashboard" className={itemClass} onClick={onNavigate}>
          Dashboard
        </Link>
        <form action={logout}>
          <button type="submit" className={stacked ? `${itemClass} w-full text-left` : itemClass}>
            Log out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className={itemClass} onClick={onNavigate}>
        Log in
      </Link>
      <Link href="/signup" className={itemClass} onClick={onNavigate}>
        Sign up
      </Link>
    </>
  );
}

export function SiteHeaderBar({
  account,
  pending = false,
}: {
  account: { email: string | null } | null;
  pending?: boolean;
}) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpenPath(null);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <BrandLink />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = link.href.startsWith("/#") ? false : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-highlight hover:text-ink ${
                  active ? "bg-highlight text-ink" : "text-ink-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <AuthLinks account={account} pending={pending} stacked={false} />
          <Link
            href="/tailor"
            className="ml-1 inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(11,110,79,0.9)] hover:bg-accent-deep"
          >
            Tailor
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-card text-ink shadow-sm lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <MenuGlyph open={open} />
        </button>
      </div>
    </header>
      {open ? (
        <div id={panelId} className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-paper lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex min-h-14 items-center rounded-2xl px-3 text-lg font-semibold"
              >
                {link.label}
              </Link>
            ))}
            <AuthLinks account={account} pending={pending} onNavigate={close} stacked />
            <Link
              href="/tailor"
              onClick={close}
              className="mt-3 inline-flex min-h-14 items-center justify-center rounded-full bg-accent px-5 text-base font-semibold text-white"
            >
              Tailor a resume
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
