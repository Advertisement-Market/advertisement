import { createContext, useContext } from 'react';

/**
 * @typedef {Object} RegisterValue
 * @property {number} currentStep
 * @property {number} maxStepReached
 * @property {number} totalSteps
 * @property {boolean} submitted
 * @property {(name: string) => any} field
 * @property {(name: string, value: any) => void} setField
 * @property {(group: string) => string[]} selection
 * @property {(group: string, value: string) => boolean} isSelected
 * @property {(group: string, value: string) => void} toggleSelection
 * @property {(n: number) => void} goToStep
 * @property {() => void} nextStep
 * @property {() => void} prevStep
 * @property {() => void} submit
 * @property {(message: string, type?: 'success'|'error') => void} showToast
 * @property {boolean} revealErrors  true after a failed Next/Submit — fields show inline errors
 */

export const RegisterContext = createContext(/** @type {RegisterValue|null} */ (null));

/** Access the registration wizard state. Must be used within <RegisterProvider>. */
export function useRegister() {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error('useRegister must be used within a RegisterProvider');
  return ctx;
}
