import { useCallback, useMemo, useRef, useState } from 'react';
import { RegisterContext } from './RegisterContext';

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Holds all wizard state for a multi-step registration form: field values,
 * multi-select selections, current/max step, toast, and submission.
 *
 * @param {object} props
 * @param {number} [props.totalSteps=7]
 * @param {(step: number, ctx: { data: object, selections: object, showToast: Function }) => boolean} props.validate
 * @param {(ctx: { data: object, selections: object, showToast: Function }) => boolean} [props.validateSubmit]
 */
export function RegisterProvider({
  totalSteps = 7,
  validate,
  validateSubmit,
  initialData,
  children,
}) {
  const [data, setData] = useState(initialData ?? {});
  const [selections, setSelections] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [revealErrors, setRevealErrors] = useState(false);

  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  const field = useCallback((name) => data[name] ?? '', [data]);
  const setField = useCallback((name, value) => setData((d) => ({ ...d, [name]: value })), []);

  const selection = useCallback((group) => selections[group] ?? [], [selections]);
  const isSelected = useCallback(
    (group, value) => (selections[group] ?? []).includes(value),
    [selections],
  );
  const toggleSelection = useCallback((group, value) => {
    setSelections((s) => {
      const arr = s[group] ?? [];
      return {
        ...s,
        [group]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }, []);

  const runValidate = useCallback(
    (step) => (validate ? validate(step, { data, selections, showToast }) : true),
    [validate, data, selections, showToast],
  );

  const goToStep = useCallback(
    (n) => {
      if (n === currentStep) return;
      if (n < currentStep) {
        setRevealErrors(false);
        setCurrentStep(n);
        scrollTop();
        return;
      }
      if (!runValidate(currentStep)) {
        setRevealErrors(true);
        return;
      }
      const newMax = Math.max(maxStepReached, currentStep);
      if (n > newMax + 1) {
        showToast('Please complete the current step first.', 'error');
        return;
      }
      setRevealErrors(false);
      setMaxStepReached(Math.max(newMax, n));
      setCurrentStep(n);
      scrollTop();
    },
    [currentStep, maxStepReached, runValidate, showToast],
  );

  const nextStep = useCallback(() => {
    if (!runValidate(currentStep)) {
      setRevealErrors(true);
      return;
    }
    if (currentStep >= totalSteps) return;
    const n = currentStep + 1;
    setRevealErrors(false);
    setMaxStepReached((m) => Math.max(m, n));
    setCurrentStep(n);
    scrollTop();
  }, [currentStep, totalSteps, runValidate]);

  const prevStep = useCallback(() => {
    setRevealErrors(false);
    setCurrentStep((cur) => Math.max(1, cur - 1));
    scrollTop();
  }, []);

  const submit = useCallback(() => {
    const ok = validateSubmit ? validateSubmit({ data, selections, showToast }) : true;
    if (!ok) {
      setRevealErrors(true);
      return;
    }
    setSubmitted(true);
    scrollTop();
  }, [validateSubmit, data, selections, showToast]);

  const value = useMemo(
    () => ({
      data,
      selections,
      currentStep,
      maxStepReached,
      totalSteps,
      submitted,
      toast,
      revealErrors,
      field,
      setField,
      selection,
      isSelected,
      toggleSelection,
      goToStep,
      nextStep,
      prevStep,
      submit,
      showToast,
    }),
    [
      data,
      selections,
      currentStep,
      maxStepReached,
      totalSteps,
      submitted,
      toast,
      revealErrors,
      field,
      setField,
      selection,
      isSelected,
      toggleSelection,
      goToStep,
      nextStep,
      prevStep,
      submit,
      showToast,
    ],
  );

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}
