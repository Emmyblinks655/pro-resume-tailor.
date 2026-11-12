"use client";

import { useState } from "react";

export function CheckoutButton({ packId }: { packId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function startCheckout() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setMessage(data.message ?? data.error ?? "Checkout is not available yet.");
    } catch {
      setMessage("Checkout is not available yet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-base font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Checking checkout..." : "Coming soon"}
      </button>
      {message ? (
        <p role="status" className="mt-3 text-sm leading-6 text-ink-soft">
          {message}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          The button is a stub. It will not charge a card.
        </p>
      )}
    </div>
  );
}
