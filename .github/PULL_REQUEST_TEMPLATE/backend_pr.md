## Backend Pull Request Summary

<!-- 1-3 sentences describing the change and why it was made. -->

### Change Classification
- [ ] 🚀 New REST Endpoint / Service Feature
- [ ] 🗄️ Database Schema Change (Flyway Migration)
- [ ] 🔒 Security / Authentication / Authorization Update
- [ ] ⚡ Performance Optimization / Caching
- [ ] 🐛 Backend Bug Fix
- [ ] 🧹 Refactor / Dependency Upgrade

---

## Technical & Documentation Checklist
*Refer to [docs/GUIDELINES.md](docs/GUIDELINES.md) for full requirements.*

- [ ] **Technical Doc / Spec:**
  - [ ] Created/Updated under `docs/` using `docs/templates/backend-pr-document-template.md` (Path: `docs/...`)
  - [ ] *OR* Exempt (Bug fix or small internal refactor not changing API/DB schema)
- [ ] **Architecture Decision Record (ADR):** Added under `docs/decisions/` (if architectural pattern or new technology introduced)
- [ ] **Database Migration:**
  - [ ] Migration script tested on fresh database
  - [ ] Backward compatibility verified (no downtime column drops)
- [ ] **Security & Validation:**
  - [ ] Input validation applied (`@Valid`, boundary checks)
  - [ ] Role authorization verified (`@PreAuthorize` / Security config)
  - [ ] No secrets or sensitive PII logged

---

## API Request / Response Sample
```http
METHOD /api/v1/endpoint
```
```json
// Sample response payload
```

---

## Verification & Test Results
- [ ] Unit tests added/updated (`mvn test`)
- [ ] Integration tests added/updated (`mvn verify`)
- [ ] Manual test evidence: (Attach curl command / Postman screenshot)
