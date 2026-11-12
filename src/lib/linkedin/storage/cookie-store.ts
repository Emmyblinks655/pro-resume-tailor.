import { readTokenEncryptionKey } from "@/lib/crypto/secret-box";
import {
  CONNECTION_COOKIE,
  CONNECTION_MAX_AGE,
  clearSealedCookie,
  sealedCookieOptions,
} from "@/lib/linkedin/cookies";
import { openConnection, sealConnection, type LinkedInConnectionRecord } from "@/lib/linkedin/record";
import type { ReadableCookies } from "@/lib/linkedin/cookies";
import type { LinkedInConnectionStore, LinkedInCookieAccess, LinkedInRead } from "@/lib/linkedin/storage/types";

const COOKIE_LIMIT = 3800;

function withoutPicture(record: LinkedInConnectionRecord): LinkedInConnectionRecord {
  return {
    ...record,
    pictureOmitted: true,
    profile: { ...record.profile, pictureUrl: null },
  };
}

export const cookieLinkedInStore: LinkedInConnectionStore = {
  kind: "encrypted-cookie",

  async read(incoming: ReadableCookies): Promise<LinkedInRead> {
    const raw = incoming.get(CONNECTION_COOKIE)?.value;
    if (!raw) return { status: "empty" };
    const key = readTokenEncryptionKey();
    if (!key) return { status: "unreadable" };
    const record = openConnection(raw, key);
    if (!record) return { status: "unreadable" };
    return { status: "ready", record };
  },

  async write(access: LinkedInCookieAccess, record: LinkedInConnectionRecord): Promise<void> {
    const key = readTokenEncryptionKey();
    if (!key) throw new Error("encryption");
    let stored = record;
    let sealed = sealConnection(stored, key);
    if (sealed.length > COOKIE_LIMIT && stored.profile.pictureUrl) {
      stored = withoutPicture(stored);
      sealed = sealConnection(stored, key);
    }
    if (sealed.length > COOKIE_LIMIT) throw new Error("cookie-too-large");
    access.outgoing.set(CONNECTION_COOKIE, sealed, sealedCookieOptions(access.secure, CONNECTION_MAX_AGE));
  },

  async delete(access: LinkedInCookieAccess): Promise<void> {
    clearSealedCookie(access.outgoing, CONNECTION_COOKIE, access.secure);
  },
};
