import { useEffect, useRef, useState } from 'react';
import { GOOGLE_ENABLED } from '@/lib/config';
import { initGoogleIdentity } from './googleIdentity';

/**
 * "Continue with Google" button rendered by Google Identity Services. On success it hands the
 * Google ID token (credential) to {@link onCredential}. Renders nothing when no client id is
 * configured (VITE_GOOGLE_CLIENT_ID).
 *
 * @param {object} props
 * @param {(idToken: string) => void} props.onCredential
 * @param {() => void} [props.onError]
 * @param {'continue_with'|'signin_with'|'signup_with'} [props.text]
 */
export function GoogleButton({ onCredential, onError, text = 'continue_with' }) {
  const ref = useRef(null);
  const cbRef = useRef(onCredential);
  const errRef = useRef(onError);
  const [failed, setFailed] = useState(false);

  // Keep the latest callbacks in refs so the GSI button is initialized only once.
  useEffect(() => {
    cbRef.current = onCredential;
    errRef.current = onError;
  });

  useEffect(() => {
    if (!GOOGLE_ENABLED) return undefined;
    let cancelled = false;
    initGoogleIdentity((idToken) => cbRef.current?.(idToken))
      .then((id) => {
        if (cancelled || !id || !ref.current) return;
        const width = Math.min(Math.max(ref.current.clientWidth || 320, 200), 400);
        ref.current.innerHTML = '';
        id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          logo_alignment: 'center',
          width,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        errRef.current?.();
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_ENABLED) return null;
  if (failed) {
    return (
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>
        Google sign-in is unavailable right now.
      </div>
    );
  }
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />;
}
