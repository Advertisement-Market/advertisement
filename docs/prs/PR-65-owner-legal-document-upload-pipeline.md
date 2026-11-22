# Full-Stack Technical Document: Legal & Approval Document Upload Pipeline

- **PR Link / Ticket:** [PR #65](https://github.com/Advertisement-Market/advertisement/pull/65) (closes [Issue #64](https://github.com/Advertisement-Market/advertisement/issues/64))
- **Author:** @AshuLaley
- **Date:** 2026-11-22
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/owner`, `backend/src/main/java/com/theadbasket/backend/common/storage`, `backend/src/main/java/com/theadbasket/backend/config`, `frontend/src/pages/OwnerRegister`

---

## 1. Overview & Problem Statement

Step 6 of the Owner Registration Wizard ("Legal Data") shows two file dropzones — **Ownership / Lease Document** and **Government Approval Certificate** — that were presentation-only placeholders with no state binding, so every file a user selected was silently discarded. The backend had no way to accept, validate, or store these documents either.

Rather than build a separate document subsystem, this change extends the existing billboard media pipeline (`OwnerMediaSyncService` and the `billboard_media` table) to carry two new document categories, while keeping legal documents private and out of the public media gallery.

---

## 2. Backend Changes

### 2.1 Media categories

`MediaCategory` gains `OWNERSHIP_DOC` and `APPROVAL_DOC` (each `maxCount = 1`, `minCount = 0`). The enum constructor arity grows from three to four with a new `isPublic` flag; all existing values are marked public and the two document values are marked private. A derived `isDocument()` helper reads `!isPublic`. No other class constructs the enum, so the arity change is contained.

### 2.2 Document storage

`FileStorageService.storeDocument` is added and implemented in `LocalFileStorageService`. It sniffs the MIME type from the file's content bytes with Apache Tika, accepts only `application/pdf`, `image/jpeg` and `image/png`, enforces a 20MB cap, and writes the file to disk verbatim — no image re-encoding, downscaling or EXIF handling. A spoofed extension (for example HTML renamed to `.pdf`) is rejected with `UNSUPPORTED_MEDIA_TYPE`, mirroring the existing `storeVideo` behaviour.

### 2.3 Sync routing

`OwnerMediaSyncService` adds a third branch to its ingestion switch: document categories are routed to `storeDocument` under a dedicated `documents/{listingId}/` prefix, instead of falling through to the image pipeline. The existing atomic rollback (orphaned files are deleted on any failure) and the per-category cap enforcement in `OwnerMediaTransactionalService` apply without change.

### 2.4 Privacy enforcement

Legal documents must never be reachable on the public media path. Two layers enforce this:

- `SecurityConfig` denies `GET /api/media/documents/**` ahead of the public media `permitAll`, so the static resource handler can never serve a document.
- A new authenticated, ownership-checked endpoint `GET /api/owner/listings/{id}/media/{mediaId}/raw` streams the file inline with `X-Content-Type-Options: nosniff`, a restrictive CSP, and `Cache-Control: no-store`.

`BillboardMediaDto.from` now takes the listing id and builds the file URL per category: public media keep their `/api/media/...` URL, while private documents resolve to the owner raw endpoint. All call sites were updated to pass the listing id.

---

## 3. Frontend Changes

### 3.1 Step 6 upload zones

The two `UploadZone` components in `OwnerRegister/steps.jsx` are bound to new `f_ownershipDocs` and `f_approvalDocs` form fields with `category`, `maxCount = 1`, and `onChange` handlers. The `accept` attribute is narrowed from the broad `image/*` glob to explicit `.pdf,.jpg,.jpeg,.png` plus the matching MIME types, so unsupported image formats are not offered by the picker.

### 3.2 PDF validation and preview

`UploadZone.validateFile` gains a document branch that accepts a PDF (or JPG/PNG) up to 20MB for the document categories; without it, the existing photo validator rejected every `.pdf`. `ThumbnailCard` detects PDFs and renders a document icon instead of attempting a broken `<img>` preview.

### 3.3 Submission

`OwnerRegister.jsx` `onSubmit` maps `f_ownershipDocs` and `f_approvalDocs` into the `allNewFiles` batch with the `OWNERSHIP_DOC` and `APPROVAL_DOC` categories, so documents are included in the single `syncMedia` call alongside photos and video.

---

## 4. Decisions & Scope Boundaries

- **Draft persistence:** document fields are intentionally **not** added to the `ownerDraftStorage.js` allowlist. That allowlist deliberately excludes all File-array media fields (day/night/surrounding photos and video) because `File` objects are not serializable to `sessionStorage`; documents follow the same rule for consistency.
- **Admin review:** there is no admin "list pending" endpoint yet, so the raw document endpoint is owner-scoped only. Admin-side document review is a separate follow-up.
- **Batch size:** the media sync batch limit (10 files, 60MB total) is unchanged; two 20MB documents plus photos are governed by the existing byte guard.
- **Database:** `billboard_media.category` is a `VARCHAR(40)` validated at the Java layer, so no Flyway migration is required for the new enum values.

---

## 5. Verification & Automated Test Coverage

| Test / Check | Command | Result |
| :--- | :--- | :--- |
| Document storage (new) | `cd backend; mvn -o test -Dtest=LocalFileStorageServiceTest` | 17 / 17 passed |
| Media URL privacy (new) | `cd backend; mvn -o test -Dtest=BillboardMediaDtoTest` | 2 / 2 passed |
| Media sync regression | `cd backend; mvn -o test -Dtest=OwnerMediaSyncIntegrationTest` | 13 / 13 passed |
| Frontend full suite | `cd frontend; npx vitest run` | 278 / 278 passed |
| Lint | `cd frontend; npm run lint` | 0 errors, 0 warnings |

The backend `UserRepositoryIT` integration test requires Docker (Testcontainers) and is not exercised in this local environment; it is unrelated to these changes.
