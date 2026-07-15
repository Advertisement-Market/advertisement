# The AdBasket

**India's outdoor advertising (OOH) marketplace** — connecting brands, billboard owners, and ad
agencies in one place. Advertisers discover and book billboard space and agencies, owners list and
monetise their inventory, and agencies win campaign tenders and showcase their work.

## Project Overview

This is a monorepo containing:

- **Frontend** — a React 19 single-page application (built and actively developed).
- **Backend** — a Spring Boot REST API, consumed by the frontend via Axios (**planned — not yet
  scaffolded**).
- **Templates** — the original hand-built HTML/CSS design source that the frontend is ported from.

> **Current phase:** frontend only. Every page is driven by **dummy data** in `frontend/src/data`;
> there is no backend or API integration wired up yet.

## Architecture

```
TheAdBasket_v1/
├── frontend/          # React 19 + Vite SPA
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md      # frontend-specific docs
├── backend/           # REST API (planned)
├── templates/         # Original static HTML/CSS (design source-of-truth)
├── .gitignore
└── README.md
```

## Roles & Features

### Advertisers (brands / businesses)
- Browse billboard spaces and ad agencies, filtered by city, budget, and type
- Post campaign briefs / tenders and receive bids
- Manage campaigns from a dashboard

### Billboard Owners
- List billboard inventory with pricing, availability, and location
- Receive and manage booking requests
- Track earnings and performance

### Ad Agencies / Service Providers
- Discover live campaign tenders and submit bids
- Build a verified public profile (GST + PAN) with portfolio and case studies
- Manage clients and services

### Platform
- Multi-step registration wizards per role, with website-wide form validation
- Auth modal (sign in / register / campaign gate) and toast notifications
- Responsive, animated marketing pages ported pixel-faithfully from the design source

## Technology Stack

| Purpose        | Technology     | Version |
| -------------- | -------------- | ------- |
| UI framework   | React          | 19.2.0  |
| Build tool     | Vite           | 8.1.5   |
| Routing        | React Router   | 7.9.0   |
| HTTP client    | Axios          | 1.11.0  |
| Styling        | Tailwind CSS   | 4.3.2   |
| Linting        | ESLint         | 10.6.0  |
| Formatting     | Prettier       | 3.6.2   |

Language: JavaScript (JSX, ES modules). The bespoke design CSS is preserved and page-scoped
alongside Tailwind (see below).

| Purpose               | Technology             | Version   |
| --------------------- | ---------------------- | --------- |
| Language              | Java (LTS)             | 25        |
| Framework             | Spring Boot            | 4.1.0     |
| Build tool            | Maven                  | 3.9.11    |
| Security              | Spring Security        | 7.1.0     |
| Persistence           | Spring Data JPA        | 4.1.0     |
| DB migrations         | Flyway                 | 12.4.0    |
| Metrics / observ.     | Micrometer             | 1.17.0    |
| Production database   | PostgreSQL             | 18.4      |
| JDBC driver           | PostgreSQL JDBC Driver | 42.7.13   |
| Dev / test database   | H2 Database            | 2.4.240   |
| Unit testing          | Mockito                | 5.22.0    |
| Integration testing   | Testcontainers         | 2.0.3     |

RESTful API, consumed by the frontend via Axios. The `backend/` directory is reserved for this API
and is **not yet scaffolded** — the frontend is intentionally decoupled (dummy data today) so the
backend can be added without reworking the UI.

## Getting Started

### Prerequisites
- **Frontend**: Node.js 18+ and npm
- **Backend** *(when scaffolded)*: Java 25 (LTS) and Maven 3.9+, PostgreSQL 18 for production

### Installation

**1. Clone the repository**
```bash
git clone <repository-url>
cd TheAdBasket_v1
```

**2. Run the frontend**
```bash
cd frontend
npm install
npm run dev        # Vite dev server → http://localhost:5173
```

### Frontend scripts
| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Production build (`dist/`)           |
| `npm run preview`   | Preview the production build         |
| `npm run lint`      | Run ESLint                           |
| `npm run format`    | Format with Prettier                 |

## Frontend Architecture Notes

The conversion strategy is **pixel-faithful**: the original bespoke CSS is *preserved* and the HTML
is componentized rather than rewritten in Tailwind. Each page's stylesheet is **scoped under a
page-root class** (e.g. `.landing-page`) so styles never bleed across routes in the SPA. Tailwind is
configured and seeded with the design tokens (`src/styles/tokens.css`) for new/incremental work.

See [frontend/README.md](frontend/README.md) for the full source-tree breakdown and conventions.

## Project Status

🚧 **Phase 1 — Frontend build (in progress)**

- ✅ Project scaffold, tooling, routing, shared component library
- ✅ Landing page
- ✅ Registration wizards for all three roles (advertiser / owner / agency)
- ✅ Role home/marketing pages for all three roles
- ✅ Website-wide form validation
- ⏳ Remaining pages — 3 dashboards + 2 browse pages — currently render a `ComingSoon` placeholder
- ⏳ Backend API (Spring Boot) — not yet started

## License

_To be added._

## Contact

_To be added._
