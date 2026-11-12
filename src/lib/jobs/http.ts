/** Shared cache window. Remotive asks for at most a few fetches a day; this stays well under a per-minute burst. */
export const JOBS_REVALIDATE_SECONDS = 45 * 60;

const USER_AGENT = "ProResumeTailor/0.1 (+https://pro-resume-tailor.vercel.app)";

export async function fetchJobJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: JOBS_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(`${label} failed`));
      },
    );
  });
}
