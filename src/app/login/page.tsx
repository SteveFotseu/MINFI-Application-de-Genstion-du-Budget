'use client';

// ============================================================
// FICHIER  : src/app/login/page.tsx
// RÔLE     : Page de connexion reliée au back-end GBE.
//
// FLUX :
//   1. Utilisateur saisit email + mot de passe
//   2. POST /api/v1/auth/login { email, password }
//   3. Back-end répond :
//      → { firstLogin: true, secretImageUri: "...", mfaToken: "..." }
//         = 1ère connexion → stocker QR + mfaToken → /register/qrcode
//      → { firstLogin: false, mfaToken: "..." }
//         = connexions suivantes → stocker mfaToken → /two-factor
//      → { accessToken: "..." }
//         = connexion directe sans 2FA → /dashboard
// ============================================================

import React, { useState } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout    from '@/components/auth/AuthLayout';
import Input         from '@/components/ui/Input';
import Button        from '@/components/ui/Button';
import { saveAccessToken } from '@/lib/authService';
import { FormErrors }      from '@/types/auth';
import { APP_ROUTES }      from '@/constants/auth';

// ── Icônes SVG inline ───────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Validation locale avant appel API
// ─────────────────────────────────────────────────────────────
function validate(email: string, password: string): FormErrors {
  const e: FormErrors = {};
  if (!email.trim()) {
    e.email = "L'adresse email est requise";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    e.email = 'Adresse email invalide';
  }
  if (!password) {
    e.password = 'Le mot de passe est requis';
  }
  return e;
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PAGE
// ─────────────────────────────────────────────────────────────
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
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    setApiError('');

    try {
      const res = await fetch('https://gbe-8clf.onrender.com/api/v1/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Identifiants incorrects. Veuillez réessayer.');
      }

      // ✅ CAS 1 : Première connexion (firstLogin: true)
      // Le back-end retourne : { firstLogin: true, secretImageUri: "...", mfaToken: "..." }
      // → Stocker l'email, le QR code et le mfaToken, puis rediriger vers /register/qrcode
      if (data.firstLogin === true) {
        sessionStorage.setItem('gbe_email_2fa',  email);
        sessionStorage.setItem('gbe_qr_code',    data.secretImageUri);
        sessionStorage.setItem('gbe_mfa_token',  data.mfaToken);
        router.push(APP_ROUTES.REGISTER_QR);
        return;
      }

      // ✅ CAS 2 : Connexions suivantes (firstLogin: false, mfaEnabled: true)
      // Le back-end retourne : { firstLogin: false, mfaEnabled: true, mfaToken: "..." }
      // → Stocker l'email et le mfaToken, puis rediriger vers /two-factor
      if (data.mfaToken) {
        sessionStorage.setItem('gbe_email_2fa', email);
        sessionStorage.setItem('gbe_mfa_token', data.mfaToken);
        router.push(APP_ROUTES.TWO_FACTOR);
        return;
      }

      // ✅ CAS 3 : Connexion directe sans 2FA (accessToken retourné directement)
      if (data.accessToken) {
        saveAccessToken(data.accessToken);
        router.push(APP_ROUTES.DASHBOARD);
        return;
      }

      // ⚠️ Cas inattendu
      setApiError(
        `Réponse inattendue du serveur. Champs reçus : ${Object.keys(data).join(', ')}`
      );

    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace de gestion budgétaire"
    >
      {apiError && (
        <div className="alert alert--error" role="alert">
          <IconAlert /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <Input
            id="email" name="email" type="email"
            label="Adresse email"
            placeholder="vous@exemple.cm"
            value={email}
            onChange={handleChange}
            error={fieldErrors.email}
            icon={<IconMail />}
            autoComplete="email"
            autoFocus
            disabled={isLoading}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Input
              id="password" name="password"
              type={showPwd ? 'text' : 'password'}
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={handleChange}
              error={fieldErrors.password}
              icon={<IconLock />}
              autoComplete="current-password"
              disabled={isLoading}
              rightElement={
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
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