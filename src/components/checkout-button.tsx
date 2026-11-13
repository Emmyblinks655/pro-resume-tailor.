"use client";

import { useState } from "react";

function checkoutDestination(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function CheckoutButton({ packId, label }: { packId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = (await response.json()) as { url?: unknown; error?: unknown };
      const destination = checkoutDestination(data.url);
      if (response.ok && destination) {
        window.location.assign(destination);
        return;
      }
      const message = typeof data.error === "string" ? data.error.trim() : "";
      setError(message || "Checkout could not start. Please try again.");
    } catch {
      setError("Checkout could not start. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-base font-semibold text-white shadow-[0_14px_30px_-16px_rgba(11,110,79,0.95)] transition hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? "Continuing…" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-center text-sm leading-6 text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
