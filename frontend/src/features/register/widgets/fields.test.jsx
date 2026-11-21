import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RegisterProvider } from '../RegisterProvider';
import { Field, PasswordField } from './fields';

function renderInProvider(ui) {
  return render(<RegisterProvider validate={() => true}>{ui}</RegisterProvider>);
}

/**
 * Issue #45: the register Field must forward name + id to its native control and
 * associate the label (htmlFor) so autofill, password managers and screen readers
 * can identify fields. getByLabelText only resolves when the label is correctly
 * associated, so it doubles as the association assertion.
 */
describe('register field name/id/label association', () => {
  afterEach(() => cleanup());

  it('forwards name and id to a text input and associates the label', () => {
    renderInProvider(<Field name="f_companyName" label="Company Name" />);
    const input = screen.getByLabelText(/company name/i);
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('name')).toBe('f_companyName');
    expect(input.getAttribute('id')).toBe('f_companyName');
  });

  it('uses an explicit id for both the control and the label', () => {
    renderInProvider(<Field name="f_email" id="custom-email" label="Email" type="email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input.getAttribute('id')).toBe('custom-email');
    expect(input.getAttribute('name')).toBe('f_email');
  });

  it('forwards name and id to a textarea', () => {
    renderInProvider(<Field name="f_notes" label="Notes" type="textarea" />);
    const el = screen.getByLabelText(/notes/i);
    expect(el.tagName).toBe('TEXTAREA');
    expect(el.getAttribute('name')).toBe('f_notes');
    expect(el.getAttribute('id')).toBe('f_notes');
  });

  it('forwards name and id to a select', () => {
    renderInProvider(
      <Field name="f_state" label="State" type="select" options={['Maharashtra', 'Gujarat']} />,
    );
    const el = screen.getByLabelText(/state/i);
    expect(el.tagName).toBe('SELECT');
    expect(el.getAttribute('name')).toBe('f_state');
    expect(el.getAttribute('id')).toBe('f_state');
  });

  it('forwards name and id to a password field and associates its label', () => {
    renderInProvider(<PasswordField name="f_password" label="Password" required />);
    const input = screen.getByLabelText(/password/i);
    expect(input.getAttribute('name')).toBe('f_password');
    expect(input.getAttribute('id')).toBe('f_password');
    expect(input.getAttribute('type')).toBe('password');
  });
});
