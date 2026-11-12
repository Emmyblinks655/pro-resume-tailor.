import { cookies } from "next/headers";

import { linkedInAppConfigured, linkedInConnectReady, supabaseConfigured, tokenEncryptionReady } from "@/lib/linkedin/config";
import { LINKEDIN_NOT_CONFIGURED_LABEL, TOKEN_ENCRYPTION_NOT_CONFIGURED_LABEL } from "@/lib/linkedin/scopes";
import { getLinkedInStore } from "@/lib/linkedin/storage";
import type { LinkedInProfile } from "@/lib/linkedin/profile";

export type LinkedInSettingsView = {
  storageLabel: string;
  buttonLabel: string;
  canStart: boolean;
  canDisconnect: boolean;
  connection:
    | { state: "absent" }
    | { state: "unreadable" }
    | { state: "error" }
    | {
        state: "connected" | "locked";
        profile: LinkedInProfile;
        connectedAt: string;
        scopes: string;
        pictureOmitted: boolean;
      };
};

export async function loadLinkedInSettings(): Promise<LinkedInSettingsView> {
  const storageLabel = supabaseConfigured()
    ? "Supabase. The access token is encrypted before it is written."
    : "An encrypted cookie on this browser. No LinkedIn token is readable by page JavaScript.";
  const buttonLabel = !linkedInAppConfigured()
    ? LINKEDIN_NOT_CONFIGURED_LABEL
    : !tokenEncryptionReady()
      ? TOKEN_ENCRYPTION_NOT_CONFIGURED_LABEL
      : "Continue to LinkedIn";
  const canStart = linkedInConnectReady();
  const jar = await cookies();
  const read = await getLinkedInStore().read(jar);

  if (read.status === "ready") {
    return {
      storageLabel,
      buttonLabel,
      canStart,
      canDisconnect: true,
      connection: {
        state: "connected",
        profile: read.record.profile,
        connectedAt: read.record.connectedAt,
        scopes: read.record.scopes,
        pictureOmitted: read.record.pictureOmitted,
      },
    };
  }
  if (read.status === "locked") {
    return {
      storageLabel,
      buttonLabel,
      canStart,
      canDisconnect: true,
      connection: {
        state: "locked",
        profile: read.record.profile,
        connectedAt: read.record.connectedAt,
        scopes: read.record.scopes,
        pictureOmitted: read.record.pictureOmitted,
      },
    };
  }
  if (read.status === "unreadable" || read.status === "error") {
    return {
      storageLabel,
      buttonLabel,
      canStart,
      canDisconnect: true,
      connection: { state: read.status },
    };
  }
  return {
    storageLabel,
    buttonLabel,
    canStart,
    canDisconnect: false,
    connection: { state: "absent" },
  };
}
