# Frontend Technical Document: [Feature / Task Title]

- **PR Link / Ticket:** [#PR_NUMBER / TICKET_ID]
- **Author:** @[github_handle]
- **Date:** YYYY-MM-DD
- **Module / Route:** `frontend/src/pages/[route]` or `frontend/src/features/[feature]`

---

## 1. Overview & User Journey
- **User Persona:** Advertiser / Billboard Owner / Agency / Unauthenticated User
- **User Flow:** Step-by-step description of the user journey from entry to completion.
- **Key UX Objectives:** What makes this interaction seamless and intuitive?

---

## 2. Component Hierarchy & Architecture
- **New Components:**
  - `ComponentName.jsx`: Description of responsibility
- **Modified Components:**
- **Component Tree (Mermaid):**
  ```mermaid
  graph TD
      ParentPage[Page Component]
      ParentPage --> Header[Header / Filter Bar]
      ParentPage --> ContentList[Content List / Grid]
      ContentList --> CardItem[Card Item Component]
      CardItem --> ActionModal[Action / Detail Modal]
  ```

---

## 3. State Management & Data Flow
- **Global Contexts Consumed:** `AuthProvider`, `ToastProvider`, `AuthModalProvider`
- **Local State & Custom Hooks:** `useState`, `useReducer`, or custom query hooks.
- **Form State & Validation:** Validation libraries, controlled inputs, error handling.

---

## 4. API Integration & Network Handling
- **API Endpoints Consumed:** `[METHOD] /api/v1/...`
- **Client Module:** Updated functions in `frontend/src/lib/apiClient.js` or feature API files.
- **State Handling Matrix:**
  - [ ] **Loading State:** Skeletons or spinners displayed?
  - [ ] **Empty State:** Helpful empty state with call-to-action rendered?
  - [ ] **Error State:** User-friendly error message or retry toast shown?
  - [ ] **Unauthorized (401/403):** Token refresh triggered or auth modal presented?

---

## 5. UI Evidence & Visual Review
*Provide screenshots or screen recording GIFs for visual review.*

| Breakpoint | Before | After |
| :--- | :--- | :--- |
| **Desktop (> 1024px)** | *(Image / N/A)* | *(Image / GIF)* |
| **Tablet (768px - 1023px)** | *(Image / N/A)* | *(Image / GIF)* |
| **Mobile (< 768px)** | *(Image / N/A)* | *(Image / GIF)* |

---

## 6. Accessibility & Responsive Design
- [ ] Keyboard navigation verified (Tab order, Enter/Space activation, Esc to close modals).
- [ ] Accessible form elements (`<label>`, `aria-label`, `aria-describedby`).
- [ ] Color contrast compliant with WCAG AA.
- [ ] Tested on mobile viewport (< 390px width) without horizontal overflow.

---

## 7. Verification & Testing Evidence
- **Automated Tests:** `npm test` or component test outputs.
- **Manual Verification Steps:**
  1. Navigate to `http://localhost:5173/[route]`
  2. Perform action: ...
  3. Verify expected UI response: ...
- **Console / Network Check:** Zero console errors or unhandled promise rejections.
