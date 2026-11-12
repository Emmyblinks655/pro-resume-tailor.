import type { LinkedInConnectionRecord } from "@/lib/linkedin/record";
import type { ReadableCookies, WritableCookies } from "@/lib/linkedin/cookies";

export type LinkedInStorageKind = "supabase" | "encrypted-cookie";

export type LinkedInRead =
  | { status: "empty" }
  | { status: "ready"; record: LinkedInConnectionRecord }
  | { status: "unreadable" }
  | { status: "locked"; record: LinkedInConnectionRecord }
  | { status: "error" };

export type LinkedInCookieAccess = {
  incoming: ReadableCookies;
  outgoing: WritableCookies;
  secure: boolean;
};

/**
 * Server-side store for one LinkedIn connection.
 * Implementations must keep access tokens out of any value returned to client components.
 * `locked` means profile columns were readable but the token ciphertext was not.
 */
export interface LinkedInConnectionStore {
  readonly kind: LinkedInStorageKind;
  read(incoming: ReadableCookies): Promise<LinkedInRead>;
  write(access: LinkedInCookieAccess, record: LinkedInConnectionRecord): Promise<void>;
  delete(access: LinkedInCookieAccess): Promise<void>;
}
