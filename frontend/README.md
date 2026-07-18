# The AdBasket — Frontend

React port of the marketing/marketplace site in `./templates`. Built with React 19,
Vite, React Router 7 and Tailwind CSS 4.

## Getting started

```bash
npm install
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # production build
npm run preview    # preview the production build
npm run lint       # ESLint
npm run format     # Prettier (write)
```

## Architecture

Pixel-faithful conversion strategy: the original bespoke CSS is **preserved** and the
HTML is componentized. Each page's stylesheet is scoped under a page-root class
(e.g. `.landing-page`) so styles never bleed across routes in the SPA. Tailwind is
configured and its theme is seeded with the design tokens (`src/styles/tokens.css`)
for new/incremental work (e.g. the stub pages).

```
src/
  main.jsx / App.jsx           # entry + Router and global providers
  router/AppRoutes.jsx         # clean-path route table
  lib/                         # cn(), ROUTES + withQuery()
  styles/                      # tokens.css, base.css (reset), index.css (Tailwind entry)
  hooks/                       # useScrolled, useInView, useCountUp, useToggle, useClickOutside
  context/                     # ToastProvider, AuthModalProvider (+ hooks)
  components/
    ui/                        # Button, Toast, Counter, Reveal, SearchSelect
    layout/                    # Logo, Navbar, Footer, PublicLayout
  features/auth/AuthModal/     # login / register / success / campaign-gate
  data/                        # navigation.js, landing.js (dummy content)
  pages/
    Landing/                   # Landing.jsx + Landing.css + sections/
    _stubs/ComingSoon.jsx      # placeholder for pages not yet ported
```

## Status (Phase 1)

- ✅ Project scaffold, tooling, routing, shared component library
- ✅ Landing page (`templates/index.html`) fully ported
- ⏳ Remaining pages (home / register / dashboard / browse for each role) render a
  `ComingSoon` placeholder and are next, using the patterns established here.

No backend or API integration at this stage — all data in `src/data` is dummy.
