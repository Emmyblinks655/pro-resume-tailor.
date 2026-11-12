import { supabaseConfigured } from "@/lib/linkedin/config";
import { cookieLinkedInStore } from "@/lib/linkedin/storage/cookie-store";
import { supabaseLinkedInStore } from "@/lib/linkedin/storage/supabase-store";
import type { LinkedInConnectionStore, LinkedInStorageKind } from "@/lib/linkedin/storage/types";

export function linkedInStorageKind(): LinkedInStorageKind {
  return supabaseConfigured() ? "supabase" : "encrypted-cookie";
}

export function getLinkedInStore(): LinkedInConnectionStore {
  return linkedInStorageKind() === "supabase" ? supabaseLinkedInStore : cookieLinkedInStore;
}
