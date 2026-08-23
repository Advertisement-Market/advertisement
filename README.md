# The AdBasket

**India's outdoor advertising (OOH) marketplace** — connecting brands, billboard owners, and ad
agencies in one place. Advertisers discover and book billboard space and agencies, owners list and
monetise their inventory, and agencies win campaign tenders and showcase their work.

## Project Overview

This is a monorepo containing:

- **Frontend** — a React 19 single-page application.
- **Backend** — a Spring Boot 4.1 / Java 25 REST API, consumed by the frontend via Axios.
  The backend is **scaffolded, tested, and fully integrated** with the frontend.
- **Templates** (`frontend/templates/`) — the original hand-built HTML/CSS design source that the
  frontend is ported from.

> **Current phase:** full-stack. The React SPA is wired to the Spring Boot API for authentication
> and registration (JWT + Google sign-in). Marketing content and dashboard analytics still render
> sample data from `frontend/src/data`.

## Architecture

```
TheAdBasket_v1/
├── frontend/                 # React 19 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── lib/              # apiClient (Axios), authStorage, routes, config
│   │   ├── context/          # AuthProvider, AuthModalProvider, ToastProvider
│   │   ├── features/auth/    # auth modal, Google button + One Tap, auth API
│   │   ├── pages/            # marketing, registration wizards, dashboards, browse
│   │   └── styles/           # tokens.css, base.css (page CSS is page-scoped)
│   ├── templates/            # original static HTML/CSS (design source-of-truth)
│   ├── vite.config.js
│   └── package.json
├── backend/                  # Spring Boot 4.1 / Java 25 REST API
│   ├── src/main/java/com/theadbasket/backend/
│   │   ├── auth/             # login, register, refresh, Google sign-in
│   │   ├── user/             # User entity + roles (MEMBER/ADVERTISER/OWNER/AGENCY)
│   │   ├── registration/     # per-role registration services
│   │   ├── security/         # JWT filter + claims principal, security config
│   │   └── config/           # externalized settings (JWT, Google, CORS, auth policy)
│   ├── src/main/resources/   # application.yml + Flyway migrations
│   └── pom.xml
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

### Platform & Authentication
- **Two-tier accounts:** a basic `MEMBER` identity account (email/password or Google), promoted to
  a marketplace role when the user completes an advertiser / owner / agency onboarding wizard
- **JWT auth:** short-lived access tokens + rotating, DB-backed refresh tokens (BCrypt passwords)
- **Google Sign-In + One Tap**, verified server-side against Google's tokeninfo endpoint
- Session-aware navigation, per-role registration wizards, and website-wide form validation

## Technology Stack

### Frontend
| Purpose        | Technology     | Version |
| -------------- | -------------- | ------- |
| UI framework   | React          | 19.2.0  |
| Build tool     | Vite           | 8.1.x   |
| Routing        | React Router   | 7.9.0   |
| HTTP client    | Axios          | 1.11.0  |
| Linting        | ESLint         | 10.6.0  |
| Formatting     | Prettier       | 3.6.2   |

Language: JavaScript (JSX, ES modules). Styling is **bespoke, page-scoped CSS** driven by design
tokens (`src/styles/tokens.css`); each page's stylesheet is scoped under a page-root class
(e.g. `.landing-page`) so styles never bleed across routes.

### Backend
| Purpose               | Technology             | Version   |
| --------------------- | ---------------------- | --------- |
| Language              | Java (LTS)             | 25        |
| Framework             | Spring Boot            | 4.1.0     |
| Build tool            | Maven                  | 3.9+      |
| Security              | Spring Security        | 7.1.0     |
| JWT                   | jjwt                   | 0.12.6    |
| Persistence           | Spring Data JPA        | 4.1.0     |
| DB migrations         | Flyway                 | 12.4.0    |
| Dev / test database   | H2 Database            | 2.4.240   |
| Production database   | PostgreSQL             | 42.7.x (driver) |
| Unit testing          | Mockito                | 5.x       |

REST API consumed by the frontend via Axios. Key settings are externalized (env-overridable):
`GOOGLE_CLIENT_ID`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, and `app.auth.*` (password policy).

## Getting Started

### Prerequisites
- **Frontend**: Node.js 18+ and npm
- **Backend**: Java 25 (LTS) and Maven 3.9+ (PostgreSQL 16+ for production; H2 is used in dev)

### 1. Clone
```bash
git clone <repository-url>
cd TheAdBasket_v1
```

### 2. Run the backend (dev profile, in-memory H2)
```bash
cd backend
# Google sign-in requires an OAuth Web client id (optional for local email/password login):
GOOGLE_CLIENT_ID=<your-google-web-client-id> mvn spring-boot:run   # → http://localhost:8080
```

### 3. Run the frontend
```bash
cd frontend
cp .env.example .env        # set VITE_GOOGLE_CLIENT_ID (optional) and VITE_API_URL
npm install
npm run dev                 # Vite dev server → http://localhost:5173
```
The Vite dev server proxies `/api` requests to the backend at `http://localhost:8080`.

### Frontend scripts
| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Production build (`dist/`)           |
| `npm run preview`   | Preview the production build         |
| `npm run lint`      | Run ESLint                           |
| `npm run format`    | Format with Prettier                 |

See [frontend/README.md](frontend/README.md) for the frontend source-tree breakdown and API wiring.

## Project Status

**Phase 1 — Frontend build** ✅ complete
- Project scaffold, tooling, routing, shared component library
- Landing page, role home/marketing pages, browse pages, and role dashboards
- Registration wizards for all three roles with website-wide form validation

**Phase 2 — Full-stack Auth & Integration** ✅ complete
- ✅ JWT access + rotating refresh token authentication
- ✅ Two-tier account structure (`MEMBER` accounts & role onboarding wizards)
- ✅ Server-verified Google Sign-In + One Tap integration
- ✅ Dynamic authenticated user context across the role dashboards

**Next** — real dashboard/browse data served from the API, notifications/OTP, and file uploads.

## License

_To be added._

## Contact

_To be added._
