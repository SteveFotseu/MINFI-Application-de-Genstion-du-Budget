'use client';

// ============================================================
// FICHIER  : src/app/two-factor/page.tsx
//
// RÔLE     : Vérification TOTP — CONNEXIONS SUIVANTES UNIQUEMENT
//
// FLUX :
//   1. L'utilisateur arrive ici depuis /login (firstLogin: false)
//   2. Il saisit le code à 6 chiffres de son appli TOTP
//   3. POST /api/v1/auth/verify { email, code, mfaToken }
//   4. ✅ Code correct → accessToken + userContext
//      → Redirection vers dashboard selon rôle
//   5. ❌ Code incorrect → message d'erreur
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout    from '@/components/auth/AuthLayout';
import Button        from '@/components/ui/Button';
import { verifyTwoFactor, saveAccessToken, saveUserContext } from '@/lib/authService';
import { APP_ROUTES, TWO_FACTOR_CODE_LENGTH, ROLE_ROUTES } from '@/constants/auth';
import { ApiError } from '@/types/auth';

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
  </svg>
);

export default function TwoFactorPage() {
  const router = useRouter();

  const [otp,        setOtp]        = useState<string[]>(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
  const [hasError,   setHasError]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [userEmail,  setUserEmail]  = useState('');
  const [mfaToken,   setMfaToken]   = useState('');

  const refs = useRef<Array<HTMLInputElement | null>>(Array(TWO_FACTOR_CODE_LENGTH).fill(null));

  useEffect(() => {
    const email    = sessionStorage.getItem('gbe_email_2fa');
    const token    = sessionStorage.getItem('gbe_mfa_token');
    if (!email) { router.replace(APP_ROUTES.LOGIN); return; }
    setUserEmail(email);
    setMfaToken(token ?? '');
  }, [router]);

  const codeIsFull = otp.every(c => c !== '');

  const handleInput = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setHasError(false);
    setErrorMsg('');
    const newOtp = [...otp];
    // Gestion du collage
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH);
      for (let i = 0; i < TWO_FACTOR_CODE_LENGTH; i++) newOtp[i] = digits[i] ?? '';
      setOtp(newOtp);
      refs.current[Math.min(digits.length, TWO_FACTOR_CODE_LENGTH - 1)]?.focus();
      return;
    }
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < TWO_FACTOR_CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) { const n = [...otp]; n[index] = ''; setOtp(n); }
      else if (index > 0) refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && index > 0) refs.current[index - 1]?.focus();
    else if  (e.key === 'ArrowRight' && index < TWO_FACTOR_CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  }, [otp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== TWO_FACTOR_CODE_LENGTH) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');

    try {
      // POST /api/v1/auth/verify { email, code, mfaToken }
      const response = await verifyTwoFactor({
        email:    userEmail,
        code:     fullCode,
        mfaToken: mfaToken,
      });

      if (response.accessToken) {
        // ✅ Sauvegarder token et contexte utilisateur
        saveAccessToken(response.accessToken);
        if (response.userContext) saveUserContext(response.userContext);

        // Nettoyer sessionStorage
        sessionStorage.removeItem('gbe_email_2fa');
        sessionStorage.removeItem('gbe_mfa_token');

        // Rediriger selon le rôle
        const role       = response.userContext?.affectations?.[0]?.roleSysteme;
        const targetPath = (role && ROLE_ROUTES[role]) ? ROLE_ROUTES[role] : APP_ROUTES.DASHBOARD;

        setSuccessMsg('Vérification réussie ! Connexion en cours…');
        setTimeout(() => router.push(targetPath), 1000);
      } else {
        setHasError(true);
        setErrorMsg('Code incorrect. Vérifiez votre application et réessayez.');
        setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
        refs.current[0]?.focus();
      }
    } catch (err) {
      setHasError(true);
      setErrorMsg(err instanceof ApiError ? err.message : 'Code invalide ou expiré.');
      setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Vérification en deux étapes"
      subtitle="Saisissez le code à 6 chiffres de votre application d'authentification"
    >

      {errorMsg  && <div className="alert alert--error"   role="alert"><IconAlert /> {errorMsg}</div>}
      {successMsg && <div className="alert alert--success" role="status"><IconCheck /> {successMsg}</div>}

      {userEmail && (
        <div className="alert alert--info" style={{ fontSize: '.8rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Vérification pour : <strong>{userEmail}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <p style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--clr-gray-600)', marginBottom: '12px' }}>
              Code à {TWO_FACTOR_CODE_LENGTH} chiffres
            </p>
            <div className="otp-container" role="group" aria-label="Code de vérification">
              {otp.map((digit, i) => (
                <input key={i}
                  ref={el => { refs.current[i] = el; }}
                  type="text" inputMode="numeric" pattern="\d*" maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  autoFocus={i === 0}
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  disabled={isLoading || !!successMsg}
                  aria-label={`Chiffre ${i + 1}`}
                  className={['otp-input', digit ? 'otp-input--filled' : '', hasError ? 'otp-input--error' : ''].join(' ')}
                />
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth disabled={!codeIsFull || isLoading || !!successMsg}>
            Vérifier le code
          </Button>

          <div style={{ textAlign: 'center', borderTop: '1px solid var(--clr-gray-100)', paddingTop: '14px' }}>
            <Link href={APP_ROUTES.LOGIN} style={{ fontSize: '.8rem', color: 'var(--clr-gray-400)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconArrowLeft /> Retour à la connexion
            </Link>
          </div>

        </div>
      </form>
    </AuthLayout>
  );
}