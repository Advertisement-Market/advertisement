# ADR 0001: Record Architecture Decisions and Maintain In-Repo Documentation

- **Status:** Accepted
- **Date:** 2026-09-07
- **Deciders:** Engineering Team
- **Consulted:** Core Maintainers

---

## Context and Problem Statement

As The AdBasket codebase grows across backend (Spring Boot) and frontend (React 19), architectural changes, technical trade-offs, and PR documentation need to be captured systematically. Storing documentation in external wikis or a separate repository leads to version drift, high maintenance friction, and forgotten documentation updates.

## Decision Drivers

- Need for atomic changes where code and documentation evolve together in a single pull request.
- Preserving historical context directly within Git history and releases.
- Eliminating cross-repo pull request overhead.
- Ensuring new joiners and contributors can quickly grasp system architecture and decision history.

## Considered Options

1. **Separate Documentation Repository:** Host documents in an isolated Git repo.
2. **External Wiki (Confluence / Notion):** Maintain architecture documentation in a cloud workspace.
3. **In-Repo Docs-as-Code (Chosen):** Keep documentation within `/docs` in the primary repository, tracking ADRs, PR design specs, and system architectures.

## Decision Outcome

Chosen Option: **In-Repo Docs-as-Code**.

### Consequences

- **Positive:**
  - Code changes and documentation updates happen in the same commit and pull request.
  - Reviewers can block PRs if technical documentation or diagrams are missing.
  - Releases and git tags preserve the exact state of documentation corresponding to that version.
- **Negative / Trade-offs:**
  - Repository size slightly increases with markdown documents and diagrams (mitigated by using Mermaid.js text diagrams rather than heavy binaries).
  - Developers must follow documentation guidelines on PR submissions.

## Guidelines

- All architectural changes, significant technical refactors, and fundamental design decisions must be captured as an ADR under `docs/decisions/` using `docs/templates/adr-template.md`.
- Non-trivial PRs must supply a completed PR document based on `docs/templates/backend-pr-document-template.md` or `docs/templates/frontend-pr-document-template.md`.
