# Backend Technical Document: [Feature / Task Title]

- **PR Link / Ticket:** [#PR_NUMBER / TICKET_ID]
- **Author:** @[github_handle]
- **Date:** YYYY-MM-DD
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/[subpackage]`

---

## 1. Overview & Business Requirements
- **Goal:** What is the intent of this change?
- **User Impact:** Which personas are affected (Advertiser, Billboard Owner, Agency, Admin)?
- **Functional Requirements:** Key acceptance criteria fulfilled by this change.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** Describe request lifecycle and service interactions.
- **Architectural Diagram (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client
      participant Controller as Spring Controller
      participant Service as Domain Service
      participant Repo as Spring Data Repository
      database DB as PostgreSQL

      Client->>Controller: HTTP Request
      Controller->>Service: Call domain method
      Service->>Repo: Query / Persist
      Repo->>DB: SQL Execution
      DB-->>Repo: Result
      Repo-->>Service: Entity / DTO
      Service-->>Controller: Domain Response
      Controller-->>Client: HTTP 200 / 201 Response
  ```

---

## 3. API Specification & Contracts

### Endpoint 1: `[METHOD] /api/v1/[path]`
- **Description:** 
- **Authentication / Roles:** `PermitAll` / `MEMBER` / `ADVERTISER` / `OWNER` / `AGENCY`
- **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "exampleField": "value"
  }
  ```
- **Response `200 OK` / `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "exampleField": "value"
    }
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: Validation failure (list fields).
  - `401 Unauthorized`: Missing or expired JWT.
  - `403 Forbidden`: Insufficient role.
  - `404 Not Found`: Resource does not exist.
  - `409 Conflict`: Unique constraint violation.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** `V[version]__[description].sql`
- **Tables Modified / Created:**
- **Index Additions & Query Impact:**
- **Backward Compatibility:** Are old rows compatible? Is zero-downtime deployment supported?

---

## 5. Security & Validation
- **Input Validation:** List `@Valid`, `@NotBlank`, `@Size`, regex, or sanitization rules applied.
- **Access Control:** Method-level security (`@PreAuthorize`) or URL security rules updated.
- **Data Protection:** Are sensitive fields (passwords, tokens, PII) masked or excluded from logs?

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** Cache keys, TTL, invalidation triggers.
- **Transactions & Concurrency:** `@Transactional` boundaries, locking mechanism (optimistic/pessimistic).
- **Failure Modes & Fallbacks:** What happens if downstream service/DB fails?

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit Tests: `[TestClassName].java`
  - Integration Tests: `[TestClassNameIT].java`
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl -X POST http://localhost:8080/api/v1/... \
    -H "Content-Type: application/json" \
    -d '{"key": "value"}'
  ```
- **Log Output Evidence:** (Paste sanitized logs showing successful execution)
