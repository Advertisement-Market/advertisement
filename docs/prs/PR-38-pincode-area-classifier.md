# Frontend Technical Document: Live India Post PIN → City/State + Area/Locality Classifier

- **PR Link / Ticket:** #38
- **Author:** @AshuLaley
- **Date:** 2026-10-22
- **Module / Package:** `frontend/src/features/auth`, `frontend/src/features/register`,
  `frontend/src/pages/{OwnerRegister, AdvertiserRegister, AgencyRegister, NewBillboardListing}`

---

## 1. Overview & Business Requirements
- **Goal:** Replace the hard-coded `PINCODE_MAP` constants (duplicated across four wizards, each
  seeding only ~9–12 cities) with a single live PIN-code classifier backed by the public India Post
  API, so any valid Indian PIN resolves to its City (District) and State and, for billboard
  addresses, to the list of localities (Post Offices) under that PIN.
- **User Impact:** Everyone registering — Owners, Advertisers and Agencies — and anyone adding a
  billboard gets City and State filled automatically from a 6-digit PIN across the whole country
  rather than a handful of seeded cities, and the billboard forms additionally offer the exact
  Area / Locality from a dropdown instead of free-typing.
- **Functional Requirements:**
  - A completed 6-digit PIN triggers a lookup on blur.
  - City and State auto-populate only when the owner has not already typed them (user input wins).
  - The billboard step offers an optional Area / Locality dropdown built from the PIN's Post Offices.
  - An invalid PIN, a "no records" response, or a network error degrades gracefully to manual entry.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** A small pure module, `pincodeLookup.js`, wraps the India Post endpoint and
  normalizes its payload. A single shared `usePincode` hook (`features/register`) calls it on blur,
  cancels any in-flight request with an `AbortController`, and exposes `{ status, loading, areas }`
  to the form; all four wizards consume this one hook instead of each carrying its own copy. Autofill
  is guarded so it never overwrites a field the user has already filled.
- **Component Flow (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor Owner
      participant UI as OwnerRegister/steps.jsx
      participant Hook as usePincode
      participant Lib as pincodeLookup.fetchPincode
      participant API as India Post API

      Owner->>UI: enters 6-digit PIN, blurs field
      UI->>Hook: onBlur(pin)
      Hook->>Lib: fetchPincode(pin, { signal })
      Lib->>API: GET /pincode/<PIN>
      API-->>Lib: [{ Status, PostOffice[] }]
      Lib-->>Hook: { ok, city, state, areas }
      Hook-->>UI: fill City/State (if empty), status badge, areas
      Owner->>UI: picks Area / Locality (billboard step)
  ```

---

## 3. External API & Contracts

### Endpoint: `GET https://api.postalpincode.in/pincode/<PIN>`
- **Description:** Public, key-less India Post lookup. Returns an array whose first element carries a
  `Status` and a `PostOffice` list; each office has `Name` (locality), `District` and `State`.
- **Authentication / Roles:** None — public API, called frontend-direct. CORS is enabled by the
  provider, so no backend proxy is required.
- **Response (success, trimmed):**
  ```json
  [
    {
      "Status": "Success",
      "PostOffice": [
        { "Name": "Bangalore Bazaar", "District": "Bangalore", "State": "Karnataka" }
      ]
    }
  ]
  ```
- **Normalized shape returned by `fetchPincode`:**
  ```json
  { "ok": true, "city": "Bangalore", "state": "Karnataka", "areas": ["Bangalore Bazaar", "..."] }
  ```
- **Failure handling:** An invalid PIN, a `Status` other than `Success`, an empty office list, a
  non-2xx response, or a thrown network/parse error all resolve to
  `{ ok: false, city: "", state: "", areas: [] }`. `fetchPincode` never throws.

---

## 4. Database & Storage Changes
- **None.** This is a frontend-only change; there is no migration and no backend contract change. The
  resolved City, State and (optional) Area are submitted through the already-existing owner
  registration address fields.

---

## 5. Security & Validation
- **Input Sanitization:** `sanitizePincode` strips non-digits and caps length at six characters;
  `isValidPincode` enforces `^[1-9][0-9]{5}$` before any network call is made.
- **No Secrets:** The India Post API needs no key or token, so nothing sensitive is embedded or
  transmitted; only the PIN the owner typed is sent.
- **Request Cancellation:** Each lookup aborts the previous one via `AbortController`, preventing a
  stale response from overwriting a newer PIN's result.
- **Autofill Safety:** City and State are only set when currently blank (after trim), so a value the
  owner typed is never clobbered by the lookup.

---

## 6. Performance, Reliability & Failure Modes
- **Network Cost:** One `GET` per completed PIN, fired on blur (not per keystroke). Duplicate/again
  blurs on an unchanged field still issue at most one in-flight request because the prior one is
  aborted.
- **Reliability:** The provider being slow or unreachable never blocks the form — the hook clears its
  loading state and the owner can type City/State/Area manually.
- **Locality List:** `parsePincodeResponse` de-duplicates and alphabetically sorts office names, so
  the dropdown is stable and free of repeats regardless of the API's ordering.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit: `pincodeLookup.test.js` — `sanitizePincode` (digit-only, 6-cap, null/undefined),
    `isValidPincode` (first digit 1-9, length), `parsePincodeResponse` (City/State extraction plus a
    de-duplicated, sorted locality list; `ok:false` for error / empty / null payloads).
  - Full frontend suite (`vitest run`): 61 tests across 9 files, 0 failures — including the
    `NewBillboardListing` component test whose wizard was rewired to the shared hook.
- **Build & Lint:** `eslint` clean on all changed files; `prettier --check` clean on the whole
  `src` glob; `vite build` succeeds.
- **Manual Verification (live API, run from the app):**
  - `560001` → Bangalore, Karnataka, 10 localities.
  - `110001` → Central Delhi, Delhi, 21 localities.
  - `400053` → Mumbai, Maharashtra (Andheri, Azad Nagar …).
  - `999999` → `ok:false`, fields left editable.
  - End-to-end in the Owner wizard: Step 2 office PIN auto-fills City/State; Step 3 billboard PIN
    auto-fills City/State and shows the "N localities found for PIN … (India Post)" dropdown.
  - End-to-end in the Agency wizard (converted form): Step 2 HQ PIN `700001` auto-fills
    Kolkata / West Bengal with the confirmation badge.

---

## 8. Scope
- All four PIN-code entry points are converted: the **Owner**, **Advertiser** and **Agency**
  registration wizards and the **New Billboard Listing** wizard. Each previously carried its own copy
  of the hard-coded `PINCODE_MAP`; those constants and the duplicated blur handlers are removed in
  favour of the single shared `usePincode` hook in `features/register`.
- The billboard-location forms (Owner Step 3 and New Billboard Listing) render the Area / Locality
  dropdown; the general-address forms (Owner Step 2 business, Advertiser contact, Agency HQ)
  auto-fill City/State with the confirmation badge only, matching the existing pattern.
- The stale `pincodeAutofill.test.js` — which unit-tested an inlined copy of the old hard-coded map
  that no form uses any more — is deleted; `pincodeLookup.test.js` covers the live classifier.
