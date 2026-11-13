import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Page not found</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">That address is not part of Pro Resume Tailor.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-5 font-semibold text-white"
      >
        Back home
      </Link>
    </div>
  );
}
