import { useState } from 'react';
import { runValidators } from '@/lib/validators';
import { useRegister } from './RegisterContext';

/**
 * Field-level validation state for a register field bound by `name`.
 * The error surfaces once the field is blurred, or after a failed Next/Submit
 * (via the provider's `revealErrors`).
 *
 * @param {string} name
 * @param {((value: any) => string|null)[]} validators
 * @returns {{ error: string|null, show: boolean, invalidClass: string, onBlur: () => void }}
 */
export function useFieldError(name, validators = []) {
  const { field, revealErrors } = useRegister();
  const [touched, setTouched] = useState(false);
  const error = runValidators(field(name), validators);
  const show = (touched || revealErrors) && !!error;
  return {
    error,
    show,
    invalidClass: show ? 'invalid' : '',
    onBlur: () => setTouched(true),
  };
}
