export type OAuthTransaction = {
  state: string;
  nonce: string;
  codeVerifier: string | null;
  redirectUri: string;
  createdAt: string;
};

export function parseOAuthTransaction(value: unknown): OAuthTransaction | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const state = typeof record.state === "string" ? record.state : "";
  const nonce = typeof record.nonce === "string" ? record.nonce : "";
  const redirectUri = typeof record.redirectUri === "string" ? record.redirectUri : "";
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : "";
  if (!state || state.length > 200 || !nonce || nonce.length > 200 || !redirectUri || !createdAt) return null;
  if (Number.isNaN(Date.parse(createdAt))) return null;
  let codeVerifier: string | null = null;
  if (record.codeVerifier != null) {
    if (typeof record.codeVerifier !== "string" || record.codeVerifier.length < 43 || record.codeVerifier.length > 128) {
      return null;
    }
    codeVerifier = record.codeVerifier;
  }
  try {
    const url = new URL(redirectUri);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !local) return null;
  } catch {
    return null;
  }
  return { state, nonce, codeVerifier, redirectUri, createdAt };
}
