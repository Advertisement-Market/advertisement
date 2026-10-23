# Frontend Technical Document: Dashboard Profile Rename, Avatar Menu & Dynamic Profile Data

- **PR Link / Ticket:** #40 (closes #36)
- **Author:** @AshuLaley
- **Date:** 2026-10-23
- **Module / Package:** `frontend/src/pages/{OwnerDashboard, AdvertiserDashboard, AgencyDashboard}`

---

## 1. Overview & Business Requirements
- **Goal:** Turn the dashboard "Settings" area into a user **Profile**, make it show the signed-in
  user's real data instead of hard-coded placeholders, and give the header avatar a small account
  menu with Profile and Logout actions.
- **User Impact:** A signed-in Owner, Advertiser or Agency user sees their own name, email and phone
  on the profile page, finds it under a "Profile" sidebar entry, and can jump to it or sign out from
  a dropdown on the avatar — instead of the avatar silently navigating and the form showing a
  fictional person's details.
- **Functional Requirements:**
  - The Account sidebar item reads **Profile**; the page title reads **User Profile**.
  - Clicking the header avatar opens a panel with **Profile** (opens the profile page) and
    **Logout** (signs out, clears the session, returns to the home page).
  - Name, email and phone on the profile page reflect the authenticated user.
  - No fabricated personal/business data is shown for fields the session does not carry.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** Each dashboard is a self-contained page with a `Sidebar`, a `Topbar` and a
  set of inner pages keyed by a `page` string. The sidebar label and page title come from each
  dashboard's `data.jsx` (`NAV`, `TITLES`). The `Topbar` renders the avatar; the profile/settings
  inner page renders the form. The signed-in user comes from `useAuth()` (`AuthContext`), which is
  rehydrated from `localStorage` by `AuthProvider`.
- **Component Flow (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor User
      participant Topbar
      participant Menu as Profile menu
      participant Auth as useAuth()
      participant Router as useNavigate()

      User->>Topbar: click avatar
      Topbar->>Menu: toggle open (click-outside / Esc closes)
      User->>Menu: click Profile
      Menu->>Topbar: onNav('settings') → show User Profile page
      User->>Menu: click Logout
      Menu->>Auth: logout() (clear session)
      Menu->>Router: navigate(ROUTES.home)
  ```

---

## 3. API & Contracts
- **None.** This is a frontend-only change. No endpoints, DTOs or request/response shapes change.
  The profile form reads the already-available `useAuth()` user and submits through the existing
  (toast-only) save handlers; Logout uses the existing `logout()` action from `AuthProvider`.

---

## 4. Database & Storage Changes
- **None.** No migrations. Logout continues to clear the session via `authStorage.clear()` as before.

---

## 5. Security & Validation
- **Data Source:** Profile identity fields are bound to the authenticated user object
  (`{ firstName, lastName, email, phone, role, emailVerified }`); nothing new is fetched or stored.
- **No Fabricated Data:** Fields the session does not carry (Business/Company Name, GST, PAN) are
  rendered as empty inputs with placeholders rather than hard-coded sample values, so one user never
  sees another's (or a fictional) identity.
- **Logout:** Clears the local session and navigates home, matching the existing navbar logout
  behaviour; the avatar menu also closes on outside-click and Escape.

---

## 6. Performance, Reliability & Failure Modes
- **Rendering:** The avatar menu is a small CSS-toggled dropdown (one extra piece of local state and
  a ref per `Topbar`); no new network calls or data fetching are introduced.
- **No User Signed In:** With no user, initials and bound fields fall back to empty strings, so the
  profile page and avatar render without errors.

---

## 7. Verification & Testing Evidence
- **Automated:**
  - `eslint` clean on the three changed dashboards; `prettier --check` clean on `src`.
  - Full frontend suite `vitest run` — 65 tests across 9 files, 0 failures (existing
    `OwnerDashboard.test.jsx` still green).
  - `vite build` succeeds.
- **Manual (in-browser, with a signed-in user, all three dashboards):**
  - Sidebar Account item shows **Profile** (no "Settings").
  - Avatar is a button that opens a panel with **Profile** and **Logout**.
  - Profile page title is **User Profile**; First Name / Last Name / Email / Phone reflect the
    signed-in user (verified as distinct Owner, Advertiser and Agency users).
  - **Logout** clears `ab_user` / `ab_access_token` and redirects to `/`.

---

## 8. Scope
- Applies to the **Owner**, **Advertiser** and **Agency** dashboards.
- The Agency dashboard keeps its pre-existing, separate **Agency Profile** (public agency page); only
  its "Settings" item is renamed to "Profile" for the account page, so the two sit side by side.
- Business/company fields are intentionally left unbound (empty + placeholder) because the session
  user object carries no such data; wiring them would need a dedicated profile endpoint (out of
  scope for this change).
