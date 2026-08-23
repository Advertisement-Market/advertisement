# The AdBasket — Frontend

React port of the marketing/marketplace site in `./templates`. Built with **React 19, Vite,
and React Router 7**, wired to the Spring Boot backend via Axios.

## Getting started

```bash
cp .env.example .env   # set VITE_API_URL and (optional) VITE_GOOGLE_CLIENT_ID
npm install
npm run dev            # start Vite dev server (http://localhost:5173)
npm run build          # production build
npm run preview        # preview the production build
npm run lint           # ESLint
npm run format         # Prettier (write)
```

The dev server proxies `/api` requests to the backend (`http://localhost:8080` by default; see
`vite.config.js` → `server.proxy`).

## Architecture

Pixel-faithful conversion strategy: the original bespoke CSS is **preserved** and the HTML is
componentized. Each page's stylesheet is **scoped under a page-root class** (e.g. `.landing-page`)
so styles never bleed across routes in the SPA. Shared design values live as CSS custom properties
in `src/styles/tokens.css`; there is no CSS utility framework.

```
src/
  main.jsx / App.jsx           # entry + Router and global providers (Auth, Toast, AuthModal, One Tap)
  router/AppRoutes.jsx         # clean-path route table
  lib/                         # apiClient (Axios), authStorage, config, cn(), ROUTES + withQuery()
  styles/                      # tokens.css (design tokens), base.css (reset), index.css (entry)
  hooks/                       # useScrolled, useInView, useCountUp, useToggle, useClickOutside
  context/                     # AuthProvider, AuthModalProvider, ToastProvider (+ hooks)
  components/
    ui/                        # Button, Toast, Counter, Reveal, SearchSelect
    layout/                    # Logo, Navbar, Footer, PublicLayout
  features/
    auth/                      # AuthModal, GoogleButton, GoogleOneTap, authApi, registration mappers
    register/                  # multi-step wizard framework + field widgets
  data/                        # sample content for marketing pages + dashboards
  pages/
    Landing/ AdvertiserHome/ OwnerHome/ AgencyHome/
    AdvertiserRegister/ OwnerRegister/ AgencyRegister/
    Browse/ BrowseAgencies/
    AdvertiserDashboard/ OwnerDashboard/ AgencyDashboard/
```

## API wiring

The frontend talks to the backend through a single Axios instance:

- **`src/lib/apiClient.js`** — Axios client with `baseURL` from `VITE_API_URL` (default
  `http://localhost:8080`). A request interceptor attaches the `Authorization: Bearer <token>`
  header; a response interceptor performs a one-time `401 → refresh → retry`.
- **`src/lib/authStorage.js`** — persists the access token, refresh token, and current user in
  `localStorage`; the session is rehydrated on load by `AuthProvider`.
- **`src/features/auth/authApi.js`** — thin wrappers over the auth/registration endpoints
  (`login`, `google`, `register`, per-role `register/*`, `me`, `logout`).
- **Dev proxy** — `vite.config.js` forwards `/api/*` to the backend so calls can be same-origin in
  development (target overridable via `VITE_API_PROXY_TARGET`).

Auth state is exposed app-wide via `useAuth()` (`src/context/AuthContext.js`), and the
sign-in/registration UI is driven by `useAuthModal()` plus the Google button / One Tap prompt.

## Status

**Full-stack.** Authentication and registration are wired to the live API:

- ✅ Email/password login + registration, and **Google Sign-In + One Tap**
- ✅ Two-tier accounts — a basic `MEMBER` account, upgraded via the role onboarding wizards
- ✅ Session-aware navbars and dashboards that read the authenticated user

Marketing content and dashboard analytics still render sample data from `src/data`; serving those
from the API is the next step.
