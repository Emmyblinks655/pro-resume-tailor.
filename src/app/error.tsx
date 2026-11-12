"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl">Something went wrong</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">
        The page could not finish loading. Your resume was not stored.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-12 items-center rounded-full bg-copper px-5 font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
