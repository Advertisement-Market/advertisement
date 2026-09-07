# The AdBasket Documentation Hub

Welcome to the centralized documentation repository for **The AdBasket**. This folder contains system architecture, architectural decisions (ADRs), developer guidelines, and technical templates.

---

## 🧭 Navigation & Quick Links

| Section | Description | Location |
| :--- | :--- | :--- |
| **Developer Guidelines** | Mandatory guidelines on writing docs, PR templates, and reviewer rules | [GUIDELINES.md](GUIDELINES.md) |
| **PR Technical Specs** | Standalone PR-level technical documents (PR-<number>-<title>.md) | [prs/PR-18-documentation-verification-system.md](prs/PR-18-documentation-verification-system.md) |
| **Backend Architecture** | File-by-file exhaustive architecture report for Spring Boot API | [architecture/backend_architecture_report.md](architecture/backend_architecture_report.md) |
| **Frontend Architecture** | Architecture, component structure, and state management report for React SPA | [architecture/frontend_architecture_report.md](architecture/frontend_architecture_report.md) |
| **Architecture Decisions** | Architecture Decision Records (ADRs) tracking architectural history | [decisions/](decisions/) |
| **Document Templates** | Reusable templates for PR technical specs and ADRs | [templates/](templates/) |

---

## 📁 Directory Structure

```text
docs/
├── architecture/               # Living system design & architectural reports
│   ├── backend_architecture_report.md
│   └── frontend_architecture_report.md
├── decisions/                  # Architecture Decision Records (ADRs)
│   └── 0001-record-architecture-decisions.md
├── prs/                        # Standalone PR technical documents (PR-<number>-<name>.md)
│   └── PR-18-documentation-verification-system.md
├── templates/                  # Standard templates
│   ├── adr-template.md
│   ├── backend-pr-document-template.md
│   └── frontend-pr-document-template.md
├── GUIDELINES.md               # Mandatory developer documentation rules
└── README.md                   # This navigation hub
```

---

## ⚡ Quick Start for Developers

1. **Before opening a PR:** Read the [Documentation Guidelines](GUIDELINES.md).
2. **Writing a backend feature:** Copy [Backend PR Document Template](templates/backend-pr-document-template.md).
3. **Writing a frontend feature:** Copy [Frontend PR Document Template](templates/frontend-pr-document-template.md).
4. **Proposing an architectural change:** Copy [ADR Template](templates/adr-template.md) to `decisions/`.
