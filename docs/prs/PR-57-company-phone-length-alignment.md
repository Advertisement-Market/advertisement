# Full-Stack Technical Document: Align Company Phone Validation Between Frontend and Backend

- **PR Link / Ticket:** [PR #57](https://github.com/Advertisement-Market/advertisement/pull/57) (closes [Issue #44](https://github.com/Advertisement-Market/advertisement/issues/44))
- **Author:** @AshuLaley
- **Date:** 2026-11-19
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/common/validation`, `frontend/src/lib`, `frontend/src/pages/OwnerRegister`, `frontend/src/features/auth`

---

## 1. Overview & Problem Statement

### 1.1 Problem Statement

Step 2 of owner registration recommends a formatted company phone via its placeholder:

```
placeholder="+91 20 2222 3333"
```

That value is 16 characters, but the backend pattern `ValidationPatterns.PHONE_OPTIONAL`
capped length at 15 (`^$|^[0-9+\-\s]{10,15}$`). Submitting the recommended format caused
`POST /api/auth/register/owner` to reject the registration:

```json
{"status":400,"errorCode":"VALIDATION_FAILED","fieldErrors":{"companyPhone":"Enter a valid phone number."}}
```

There was also a second, frontend-only mismatch: the `f_companyPhone` field used
`type="tel"`, which auto-applied the 10-digit **mobile** validator (`phone()`). An
office/landline number — including the field's own recommended placeholder — was flagged
inline with "Enter a valid 10-digit mobile number.", even though company phones are not
mobiles.

### 1.2 Solution Goals

- Accept reasonable formatted company phones (country code + spaces) on both tiers.
- Make the frontend and backend agree on what a company phone is, so the recommended
  placeholder validates identically on both sides.
- Keep the primary mobile fields (which are always sent as 10 stripped digits) unaffected.

---

## 2. Backend Changes

`ValidationPatterns.PHONE` and `PHONE_OPTIONAL` were widened from `{10,15}` to `{10,20}`:

```java
public static final String PHONE = "^[0-9+\\-\\s]{10,20}$";
public static final String PHONE_OPTIONAL = "^$|^[0-9+\\-\\s]{10,20}$";
```

`PHONE_OPTIONAL` is used only by the owner `companyPhone` field (`OwnerRegistrationRequest`
and `OwnerOnboardingRequest`). `PHONE` backs the required mobile on every registration DTO;
widening it only loosens the bound and never rejects a previously valid value. The change
accommodates formatted numbers with a country code and internal spaces.

---

## 3. Frontend Changes

### 3.1 New `telephone` validator

A `telephone()` validator was added to `validators.js`, backed by
`/^[0-9+\-\s]{10,20}$/` — the exact mirror of the backend `PHONE` regex — with the message
"Enter a valid phone number." (matching the backend message). It is empty-friendly so it
composes with optional fields.

### 3.2 Company phone field

The `f_companyPhone` field keeps `type="tel"` (for the numeric input mode) but now sets
`validateAs="text"` to suppress the auto-applied 10-digit mobile validator, and passes
`rules={[v.telephone()]}`. The field now validates as a general phone, consistent with the
backend.

### 3.3 Submission normalization

`registrationMappers.js` maps `companyPhone` through a new `phoneOrNull` helper that trims
and collapses internal whitespace runs to a single space, so a value with stray extra
spaces stays within the 20-character limit.

---

## 4. Verification & Automated Test Coverage

| Test / Check | Command | Result |
| :--- | :--- | :--- |
| Backend phone pattern (new) | `cd backend; mvn -o test -Dtest=PhoneValidationTest` | 7 / 7 passed |
| Backend DTO validation (regression) | `cd backend; mvn -o test -Dtest=AddressValidationTest` | 20 / 20 passed |
| Frontend validators + mappers | `cd frontend; npx vitest run src/lib/validators.test.js src/features/auth/registrationMappers.test.js` | 48 / 48 passed |
| Frontend full suite | `cd frontend; npx vitest run` | 17 files, 228 / 228 passed |
| Lint | `cd frontend; npm run lint` | 0 errors, 0 warnings |
| Production build | `cd frontend; npx vite build` | Built cleanly |

Manual verification in the dev server confirmed the frontend behavior on Step 2 of owner
registration: entering the recommended "+91 20 2222 3333" shows no error, while an invalid
"98765abcde" shows "Enter a valid phone number." (the general-phone message, not the mobile
one).

---

## 5. Scope Boundaries

- The required mobile fields on all registration forms continue to use the strict 10-digit
  `phone()` validator on the frontend; only the owner `companyPhone` field was switched to
  the general `telephone()` validator.
- No database migration is needed — `companyPhone` is stored as free text on `OwnerProfile`.
