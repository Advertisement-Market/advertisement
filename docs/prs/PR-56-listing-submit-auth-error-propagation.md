# Frontend Technical Document: Propagate 401/403 Auth Errors on Billboard Listing Submission

- **PR Link / Ticket:** [PR #56](https://github.com/Advertisement-Market/advertisement/pull/56) (closes [Issue #43](https://github.com/Advertisement-Market/advertisement/issues/43))
- **Author:** @AshuLaley
- **Date:** 2026-11-19
- **Module / Package:** `frontend/src/pages/NewBillboardListing`

---

## 1. Overview & Problem Statement

### 1.1 Problem Statement

The billboard listing wizard swallowed authentication failures on submit. Both submit
paths in `NewBillboardListing.jsx` contained a development-mode branch that caught `401`
and `403` responses and returned without re-throwing:

```js
if (env?.DEV && (err?.response?.status === 401 || err?.response?.status === 403)) {
  console.warn('[DEV] Auth error suppressed on edit submit.');
  return;
}
```

When an unauthenticated user — or one whose session had expired — tried to create or edit
a listing, the backend correctly returned `401 Unauthorized`. Because the error was
suppressed, the submit promise resolved normally and the wizard advanced to its
`SuccessScreen` ("Billboard Listed!" / "Billboard Updated!"). The user got a false
confirmation while nothing was ever persisted to the database.

### 1.2 Solution Goals

- Remove the silent `401`/`403` suppression so authentication failures propagate.
- Let the existing error surfaces take over: the wizard throws, and the global apiClient
  session-expiry handling shows the "Your session has expired. Please sign in to continue."
  toast and reopens the sign-in modal where applicable.
- Keep the change minimal and add a regression test that locks in the behavior.

---

## 2. Technical Details

### 2.1 Affected submit paths

There were two copies of the suppression branch, both removed:

1. **`createSubmitHandler(...)`** — the exported, unit-testable factory used for the
   metadata create/edit submit. Its now-unused `env` parameter was also removed.
2. **The inline `onSubmit` handler** inside `NewBillboardListing` — the live path that
   creates the listing, syncs media, and calls `submitListing`. Its `import.meta.env.DEV`
   suppression branch was removed while the `FieldFormatError` and `isSubmissionFailure`
   handling above it were left intact.

After removal, a failed submit always reaches:

```js
const fallback = isEdit
  ? 'Failed to update billboard listing.'
  : 'Failed to create billboard listing.';
throw new Error(apiErrorMessage(err, fallback), { cause: err });
```

so the thrown message is either the server-provided error (e.g. an
`AUTHENTICATION_REQUIRED` message) or the create/update fallback. The `RegisterProvider`
onSubmit contract treats a thrown error as a failed submission and does not advance to the
success screen.

### 2.2 Out of scope

A separate `import.meta.env.DEV` branch in the edit-mode *load* path (which substitutes a
mock listing when the GET fails in dev) is unrelated to the false-success bug and was left
unchanged.

---

## 3. Verification & Automated Test Coverage

A regression test was added to the `createSubmitHandler` suite asserting that a `401`
rejection now propagates (the handler rejects with the create-failure message) rather than
resolving silently — the exact false-success scenario from Issue #43.

| Test / Check | Command | Result |
| :--- | :--- | :--- |
| NewBillboardListing suite (incl. new case) | `cd frontend; npx vitest run src/pages/NewBillboardListing/NewBillboardListing.test.jsx` | 39 / 39 passed |
| Lint | `cd frontend; npm run lint` | 0 errors, 0 warnings |
| Production build | `cd frontend; npx vite build` | Built cleanly |

The pre-existing `env: { DEV: false }` network-failure test continues to pass, confirming
the normal fallback message path is unaffected.
