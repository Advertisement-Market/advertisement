/**
 * Explicit-allowlist sessionStorage draft persistence for the Owner Registration wizard.
 *
 * Security & privacy invariants:
 * - Uses a strict ALLOWLIST (never a denylist): secrets (`f_password`, `f_confirmPassword`),
 *   consent checkboxes (`f_termsAccept`), and non-serializable File arrays are NEVER persisted.
 * - Identity-scoped keys (`ab_owner_register_draft:u:<userId>` or `:anon`) prevent cross-user
 *   PII leakage on shared browsers.
 * - 30-minute sliding TTL with injectable clock (`now`) for deterministic testing.
 * - Cleared on submit, cancel, logout, session expiry, and lost-201 recovery.
 */

export const OWNER_DRAFT_PREFIX = 'ab_owner_register_draft:';
export const OWNER_DRAFT_TTL_MS = 30 * 60 * 1000;
export const OWNER_DRAFT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export const OWNER_DRAFT_ALLOWLIST = Object.freeze([
  // Step 1 (non-secret identity & verification)
  'f_firstName',
  'f_lastName',
  'f_email',
  'f_phone',
  'f_emailVerified',
  'f_phoneVerified',
  // Step 2 (business info)
  'f_companyName',
  'f_companyPhone',
  'f_companyReg',
  'f_gst',
  'f_bizAddr1',
  'f_bizAddr2',
  'f_bizCity',
  'f_bizState',
  'f_bizPin',
  // Step 3 (billboard details)
  'f_bbName',
  'f_bbAddr',
  'f_bbArea',
  'f_bbAddr2',
  'f_bbLandmark',
  'f_bbCity',
  'f_bbState',
  'f_bbPin',
  'f_bbType',
  'f_bbTypeOther',
  'f_bbWidth',
  'f_bbHeight',
  'f_bbGroundHeight',
  'f_facing',
  'f_trafficType',
  'f_trafficOther',
  'f_audience',
  'f_audienceOther',
  'f_footfall',
  // Step 4 (pricing & availability)
  'f_startPrice',
  'f_minBookingValue',
  'f_minBookingUnit',
  'f_discountNote',
  'f_blockedDates',
  'f_pricingPackages',
  // Step 6 (legal)
  'f_licenseNo',
  'f_ownership',
  'f_approval',
]);

export function draftKeyFor(userId) {
  return userId != null ? `${OWNER_DRAFT_PREFIX}u:${userId}` : `${OWNER_DRAFT_PREFIX}anon`;
}

function pickAllowlisted(data, { excludeEmail = false } = {}) {
  const picked = {};
  if (!data || typeof data !== 'object') return picked;
  for (const key of OWNER_DRAFT_ALLOWLIST) {
    if (excludeEmail && key === 'f_email') continue;
    const val = data[key];
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    picked[key] = val;
  }
  return picked;
}

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Saves allowlisted wizard fields with a 30-min sliding TTL capped at 2 hours absolute age. */
export function saveOwnerRegisterDraft(data, userId = null, now = () => Date.now()) {
  const storage = getStorage();
  if (!storage) return;
  const fields = pickAllowlisted(data, { excludeEmail: userId != null });
  if (Object.keys(fields).length === 0) return;
  const key = draftKeyFor(userId);
  const currentTs = now();
  let createdAt = currentTs;
  try {
    const existingRaw = storage.getItem(key);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw);
      if (
        existing &&
        typeof existing.createdAt === 'number' &&
        currentTs < existing.createdAt + OWNER_DRAFT_MAX_AGE_MS
      ) {
        createdAt = existing.createdAt;
      }
    }
  } catch {
    // Ignore parse errors and start fresh
  }
  const hardCap = createdAt + OWNER_DRAFT_MAX_AGE_MS;
  const envelope = {
    createdAt,
    expiresAt: Math.min(currentTs + OWNER_DRAFT_TTL_MS, hardCap),
    fields,
  };
  try {
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Ignore quota/storage errors
  }
}

/** Loads a non-expired draft for the given scope. Drops `f_email` when signed in. */
export function loadOwnerRegisterDraft(userId = null, now = () => Date.now()) {
  const storage = getStorage();
  if (!storage) return null;
  const key = draftKeyFor(userId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAt !== 'number') {
      storage.removeItem(key);
      return null;
    }
    const currentTs = now();
    const hardCap =
      typeof parsed.createdAt === 'number'
        ? parsed.createdAt + OWNER_DRAFT_MAX_AGE_MS
        : parsed.expiresAt;
    if (currentTs >= parsed.expiresAt || currentTs >= hardCap) {
      storage.removeItem(key);
      return null;
    }
    const fields = pickAllowlisted(parsed.fields, { excludeEmail: userId != null });
    return Object.keys(fields).length > 0 ? fields : null;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
    return null;
  }
}

/**
 * Migrates a non-expired anonymous draft to the newly signed-in user's scope:
 * - Drops `f_email` so the signed-in account's email always wins.
 * - Preserves original `createdAt` and `expiresAt` (does not extend TTL).
 * - Deletes the `:anon` key immediately.
 */
export function migrateAnonDraftToUser(userId, now = () => Date.now()) {
  if (userId == null) return null;
  const storage = getStorage();
  if (!storage) return null;
  const anonKey = draftKeyFor(null);
  try {
    const raw = storage.getItem(anonKey);
    if (!raw) return null;
    storage.removeItem(anonKey);
    const parsed = JSON.parse(raw);
    const currentTs = now();
    const hardCap =
      typeof parsed?.createdAt === 'number'
        ? parsed.createdAt + OWNER_DRAFT_MAX_AGE_MS
        : parsed?.expiresAt;
    if (
      !parsed ||
      typeof parsed.expiresAt !== 'number' ||
      currentTs >= parsed.expiresAt ||
      currentTs >= hardCap
    ) {
      return null;
    }
    const fields = pickAllowlisted(parsed.fields, { excludeEmail: true });
    if (Object.keys(fields).length === 0) return null;
    const envelope = {
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : currentTs,
      expiresAt: parsed.expiresAt,
      fields,
    };
    storage.setItem(draftKeyFor(userId), JSON.stringify(envelope));
    return fields;
  } catch {
    try {
      storage.removeItem(anonKey);
    } catch {
      // Ignore storage errors
    }
    return null;
  }
}

/** Discards only the `:anon` draft (used when a user signs in without an explicit handoff). */
export function clearAnonOwnerDraft() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(draftKeyFor(null));
  } catch {
    // Ignore storage errors
  }
}

/** Wipes all owner registration drafts (both `:anon` and any `:u:*`) from sessionStorage. */
export function clearOwnerRegisterDraft() {
  const storage = getStorage();
  if (!storage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k && k.startsWith(OWNER_DRAFT_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}
