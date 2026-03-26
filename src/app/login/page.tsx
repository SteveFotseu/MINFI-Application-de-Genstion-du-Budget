'use client';

// ============================================================
// FICHIER  : src/app/login/page.tsx
//
// WORKFLOW CONNEXION :
//
//  1ère connexion  → firstLogin: true
//    Back-end retourne : { firstLogin: true, mfaEnabled: false, secretImageUri: "...", mfaToken: "..." }
//    → Stocker QR code + email + mfaToken en sessionStorage
//    → Rediriger vers /register/qrcode
//
//  Connexions suivantes → firstLogin: false
//    Back-end retourne : { firstLogin: false, mfaEnabled: true, mfaToken: "..." }
//    → Stocker email + mfaToken en sessionStorage
//    → Rediriger vers /two-factor
// ============================================================

import React, { useState } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout    from '@/components/auth/AuthLayout';
import Input         from '@/components/ui/Input';
import Button        from '@/components/ui/Button';
import { loginUser, saveAccessToken } from '@/lib/authService';
import { ApiError, FormErrors }       from '@/types/auth';
import { APP_ROUTES }                 from '@/constants/auth';

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function validate(email: string, password: string): FormErrors {
  const e: FormErrors = {};
  if (!email.trim())
    e.email = "L'adresse email est requise.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = "L'adresse email est invalide.";
  if (!password)
    e.password = 'Le mot de passe est requis.';
  return e;
}

export default function LoginPage() {
  const router = useRouter();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email')    setEmail(value);
    if (name === 'password') setPassword(value);
    if (fieldErrors[name])   setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    setApiError('');
    setFieldErrors({});

    try {
      const data = await loginUser({ email, password });

      // ══════════════════════════════════════════════════════
      // CAS 1 — PREMIÈRE CONNEXION (firstLogin: true)
      // Back-end : { firstLogin: true, mfaEnabled: false, secretImageUri: "...", mfaToken: "..." }
      // → Afficher le QR code à scanner (une seule fois dans la vie du compte)
      // ══════════════════════════════════════════════════════
      if (data.firstLogin === true) {
        sessionStorage.setItem('gbe_email_2fa', email);
        // Stocker le mfaToken — indispensable pour setup-mfa
        if (data.mfaToken) sessionStorage.setItem('gbe_mfa_token', data.mfaToken);
        // Stocker le QR code à afficher
        if (data.secretImageUri) sessionStorage.setItem('gbe_qr_code', data.secretImageUri);
        router.push(APP_ROUTES.REGISTER_QR);
        return;
      }

      // ══════════════════════════════════════════════════════
      // CAS 2 — CONNEXIONS SUIVANTES (firstLogin: false)
      // Back-end : { firstLogin: false, mfaEnabled: true, mfaToken: "..." }
      // → L'utilisateur saisit son code TOTP sans scanner le QR
      // ══════════════════════════════════════════════════════
      if (data.firstLogin === false) {
        sessionStorage.setItem('gbe_email_2fa', email);
        // Stocker le mfaToken — indispensable pour verify
        if (data.mfaToken) sessionStorage.setItem('gbe_mfa_token', data.mfaToken);
        router.push(APP_ROUTES.TWO_FACTOR);
        return;
      }

      // ══════════════════════════════════════════════════════
      // CAS 3 — SANS 2FA (accessToken retourné directement)
      // ══════════════════════════════════════════════════════
      if (data.accessToken) {
        saveAccessToken(data.accessToken);
        router.push(APP_ROUTES.DASHBOARD);
        return;
      }

      setApiError("Réponse inattendue du serveur. Veuillez contacter l'administrateur.");

    } catch (err) {
      if (err instanceof ApiError) {
        if (Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        } else {
          setApiError(err.message);
          if (err.code === 'BAD_CREDENTIALS')
            setFieldErrors({ email: ' ', password: ' ' });
          else if (err.code === 'USER_NOT_FOUND' || err.code === 'USERNAME_NOT_FOUND')
            setFieldErrors({ email: 'Aucun compte trouvé avec cette adresse email.' });
          else if (err.code === 'ERR_USER_DISABLED')
            setFieldErrors({ email: 'Ce compte est désactivé. Contactez votre administrateur.' });
        }
      } else {
        setApiError('Une erreur inattendue est survenue. Vérifiez votre connexion et réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace de gestion budgétaire">

      {apiError && (
        <div className="alert alert--error" role="alert">
          <IconAlert /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <Input
            id="email" name="email" type="email"
            label="Adresse email" placeholder="prenom.nom@minfi.cm"
            value={email} onChange={handleChange}
            error={fieldErrors.email} icon={<IconMail />}
            autoComplete="email" autoFocus disabled={isLoading}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Input
              id="password" name="password"
              type={showPwd ? 'text' : 'password'}
              label="Mot de passe" placeholder="••••••••"
              value={password} onChange={handleChange}
              error={fieldErrors.password} icon={<IconLock />}
              autoComplete="current-password" disabled={isLoading}
              rightElement={
                <button type="button" className="pwd-toggle"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}>
                  {showPwd ? <IconEyeOff /> : <IconEye />}
                </button>
              }
            />
            <Link href={APP_ROUTES.FORGOT_PASSWORD} className="forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth>
            Se connecter
          </Button>

          <div className="secure-badge">
            <IconShield />
            Connexion sécurisée – MINFI Cameroun
          </div>

        </div>
      </form>

      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <Link href={APP_ROUTES.REGISTER}>Créer un compte</Link>
      </p>

    </AuthLayout>
  );
}