const NOTICES: Record<string, string> = {
  connected:
    "LinkedIn is connected. Saved fields are your name, email, profile photo, and member ID. The access token stays on the server.",
  disconnected_revoked:
    "Disconnected. Saved profile data and the access token were deleted, and LinkedIn accepted the revocation.",
  disconnected_unsupported:
    "Disconnected. Saved data was deleted. LinkedIn did not offer token revocation for this sign-in. You can also remove Pro Resume Tailor under LinkedIn Settings, Data privacy, Permitted services.",
  disconnected_failed:
    "Disconnected. Saved data was deleted here. LinkedIn did not confirm revocation. Remove Pro Resume Tailor under LinkedIn Settings, Data privacy, Permitted services if you want the grant gone there too.",
  disconnected_unreadable:
    "Disconnected. A stored connection was deleted. It could not be decrypted, so LinkedIn was not asked to revoke a token.",
  disconnected_local: "No LinkedIn connection was stored.",
  error_denied: "LinkedIn did not grant access. Nothing was saved.",
  error_state: "That sign-in did not match this browser. Nothing was saved. Start again from the consent page.",
  error_nonce: "LinkedIn’s response failed the nonce check. Nothing was saved.",
  error_token: "LinkedIn did not return a usable token. Nothing was saved.",
  error_profile: "LinkedIn did not return the expected profile. Nothing was saved.",
  error_storage: "The connection could not be stored. Nothing new was kept.",
  error_not_configured: "LinkedIn connect is not configured yet.",
  error_encryption: "Token encryption is not configured yet, so sign-in stayed off.",
  error_redirect: "The LinkedIn redirect URL is not valid, so sign-in stayed off.",
  error_start: "That request did not start on this site. Nothing was changed.",
};

export function linkedInNotice(code: string | undefined): string | null {
  if (!code) return null;
  return NOTICES[code] ?? null;
}

export function readNoticeCode(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
