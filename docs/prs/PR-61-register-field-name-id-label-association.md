# Frontend Technical Document: Forward name/id and Associate Labels in Register Field Widgets

- **PR Link / Ticket:** [PR #61](https://github.com/Advertisement-Market/advertisement/pull/61) (closes [Issue #45](https://github.com/Advertisement-Market/advertisement/issues/45))
- **Author:** @AshuLaley
- **Date:** 2026-11-21
- **Module / Package:** `frontend/src/features/register/widgets`

---

## 1. Overview & Problem Statement

### 1.1 Problem Statement

In `frontend/src/features/register/widgets/fields.jsx`, the shared `Field` component bound
to `RegisterProvider` via its `name` prop but never set the native control's `name` or `id`
attributes when rendering `<input>`, `<select>` or `<textarea>`. `FieldLabel` rendered a
bare `<label>` with no `htmlFor`. This caused:

- A WCAG 2.1 failure on 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value) —
  labels were not programmatically associated with their controls.
- Browser autofill and password managers (1Password, Bitwarden, Chrome/Safari Autofill)
  could not reliably identify or populate the fields.
- Screen readers could not announce a field's label when the control received focus.

### 1.2 Solution Goals

- Forward `name` and `id` to every native control the `Field` component renders.
- Associate the label with its control via `htmlFor`.
- Apply the same treatment to the `PasswordField` and `ConfirmPasswordField` widgets in the
  same file, since password managers depend most on correctly identified password inputs.

---

## 2. Implementation Details

### 2.1 FieldLabel

`FieldLabel` now accepts an `htmlFor` prop and applies it to the `<label>`:

```jsx
export function FieldLabel({ htmlFor, label, required, optional }) {
  return (
    <label htmlFor={htmlFor}>
      {label} {required && <span className="req">*</span>}
      {optional && <span className="opt">(optional)</span>}
    </label>
  );
}
```

### 2.2 Field

`Field` computes `const fieldId = rest.id ?? name;` and forwards `name={name}` and
`id={fieldId}` to the `<input>`, `<select>` and `<textarea>` branches, and passes
`htmlFor={fieldId}` to `FieldLabel`. An explicit `id` prop still wins, so callers can
override it; otherwise the register field name (e.g. `f_companyName`) is used, which is
unique per rendered wizard step.

### 2.3 Password widgets

`PasswordField` and `ConfirmPasswordField` set `name={name}` and `id={name}` on their
inputs and pass `htmlFor={name}` to `FieldLabel`, matching the `Field` behavior.

---

## 3. Scope Boundaries

- The fix targets the reusable widgets in `fields.jsx`, which back roughly 66 `<Field>`
  usages across the advertiser, owner, agency and billboard-listing wizards, plus the
  `PasswordField` / `ConfirmPasswordField` instances in the advertiser and agency forms.
- The owner wizard's Step 1 hand-rolls its OTP-verified email/phone/password inputs
  directly in `OwnerRegister/steps.jsx` rather than using these widgets; those inputs are
  outside the `fields.jsx` scope named by the issue and are not changed here.

---

## 4. Verification & Automated Test Coverage

A new test, `fields.test.jsx`, renders each widget inside a `RegisterProvider` and uses
`getByLabelText` (which only resolves when the label is correctly associated) to assert the
`name`, `id` and label wiring for text, explicit-id, textarea, select and password cases.

| Test / Check | Command | Result |
| :--- | :--- | :--- |
| Field widgets (new) | `cd frontend; npx vitest run src/features/register/widgets/fields.test.jsx` | 5 / 5 passed |
| Full frontend suite | `cd frontend; npx vitest run` | 231 passed (1 pre-existing flaky OwnerDashboard test passes 16/16 in isolation) |
| Lint | `cd frontend; npm run lint` | 0 errors, 0 warnings |
| Production build | `cd frontend; npx vite build` | Built cleanly |

Manual verification in the dev server confirmed the live DOM: on owner registration the
`Field`-based inputs (`f_firstName`, `f_lastName`, `f_email`) carry matching `name`/`id`
with associated labels, and on advertiser registration the password fields
(`f_password`, `f_confirmPassword`) carry `name`/`id` with associated labels.
