'use client';

// ============================================================
// FICHIER  : src/app/register/qrcode/page.tsx
// RÔLE     : 1ère connexion — affichage QR + saisie OTP
// Corps envoyé à setup-mfa : { email, code, mfaToken }
// Réponse reçue : { accessToken, userContext: { userId, role, mandats, ... } }
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image         from 'next/image';
import Link          from 'next/link';
import Button        from '@/components/ui/Button';
import { setupMfa, saveAccessToken, saveUserContext } from '@/lib/authService';
import { APP_ROUTES, ROLE_ROUTES, TWO_FACTOR_CODE_LENGTH } from '@/constants/auth';

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export default function QrCodePage() {
  const router = useRouter();

  const [qrCodeUrl,  setQrCodeUrl]  = useState<string | null>(null);
  const [userEmail,  setUserEmail]  = useState('');
  const [mfaToken,   setMfaToken]   = useState('');
  const [otp,        setOtp]        = useState<string[]>(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
  const [isLoading,  setIsLoading]  = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refs = useRef<Array<HTMLInputElement | null>>(Array(TWO_FACTOR_CODE_LENGTH).fill(null));

  useEffect(() => {
    const storedQr    = sessionStorage.getItem('gbe_qr_code');
    const storedEmail = sessionStorage.getItem('gbe_email_2fa');
    const storedToken = sessionStorage.getItem('gbe_mfa_token');
    if (!storedQr || !storedToken) { router.replace(APP_ROUTES.LOGIN); return; }
    setQrCodeUrl(storedQr);
    setUserEmail(storedEmail ?? '');
    setMfaToken(storedToken);
  }, [router]);

  const codeIsFull = otp.every(c => c !== '');
  const otpValue   = otp.join('');

  const handleInput = useCallback((index: number, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    setErrorMsg('');
    const next = [...otp];
    if (raw.length > 1) {
      const digits = raw.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH);
      for (let i = 0; i < TWO_FACTOR_CODE_LENGTH; i++) next[i] = digits[i] ?? '';
      setOtp(next);
      refs.current[Math.min(digits.length, TWO_FACTOR_CODE_LENGTH - 1)]?.focus();
      return;
    }
    next[index] = raw; setOtp(next);
    if (raw && index < TWO_FACTOR_CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) { const next = [...otp]; next[index] = ''; setOtp(next); }
      else if (index > 0) refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && index > 0) refs.current[index - 1]?.focus();
    else if   (e.key === 'ArrowRight' && index < TWO_FACTOR_CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  }, [otp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeIsFull) return;
    setIsLoading(true); setErrorMsg('');

    try {
      // ✅ Envoi : { email, code, mfaToken }
      const response = await setupMfa({ email: userEmail, code: otpValue, mfaToken });

      if (response.accessToken) {
        saveAccessToken(response.accessToken);

        // ✅ Le back-end retourne "userContext" (pas "user")
        const uc = response.userContext;
        if (uc) {
          saveUserContext({
            id:        uc.userId,
            firstName: uc.firstName,
            lastName:  uc.lastName,
            email:     uc.email,
            role:      uc.role,
            mandats:   uc.mandats ?? [],
          });
        }

        sessionStorage.removeItem('gbe_qr_code');
        sessionStorage.removeItem('gbe_mfa_token');
        sessionStorage.removeItem('gbe_email_2fa');

        setSuccessMsg('Authentification configurée ! Connexion en cours…');

        // ✅ Redirection selon le rôle
        const role = uc?.role ?? '';
        const dest = ROLE_ROUTES[role] ?? APP_ROUTES.DASHBOARD;
        setTimeout(() => router.push(dest), 1400);

      } else {
        setErrorMsg(response.message || 'Code incorrect. Veuillez réessayer.');
        setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
        refs.current[0]?.focus();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Code invalide ou expiré.');
      setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!qrCodeUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-off-white)' }}>
        <div style={{ textAlign: 'center', color: 'var(--clr-gray-400)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--clr-gray-200)', borderTopColor: 'var(--clr-navy)', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 16px' }} />
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-off-white)', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column' }}>

      <header style={{ background: 'linear-gradient(160deg, var(--clr-navy) 0%, #091e3a 55%, var(--clr-navy-mid) 100%)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', boxShadow: '0 4px 24px rgba(13,43,85,.30)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div style={{ background: 'var(--clr-green)' }} /><div style={{ background: 'var(--clr-red)' }} /><div style={{ background: 'var(--clr-yellow)' }} />
        </div>
        <Image src="/images/logo-minfi.png" alt="MINFI" width={48} height={48} style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }} />
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>République du Cameroun</p>
          <p style={{ fontSize: '.75rem', color: 'var(--clr-yellow)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Ministère des Finances – GBE</p>
        </div>
        <Image src="/images/cameroon_flag.jpg" alt="Drapeau" width={60} height={40} style={{ borderRadius: 4, border: '1px solid rgba(255,255,255,.2)' }} />
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 500, background: 'var(--clr-white)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--clr-green), var(--clr-yellow), var(--clr-red))' }} />
          <div style={{ padding: '32px' }}>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(13,43,85,.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(13,43,85,.12)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--clr-navy)" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/>
                </svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--clr-navy)', marginBottom: 8 }}>
                Configurez votre authentification
              </h1>
              <p style={{ fontSize: '.875rem', color: 'var(--clr-gray-400)', lineHeight: 1.6 }}>
                Scannez ce QR code avec Google Authenticator,<br/>puis entrez le code généré ci-dessous.
              </p>
              {userEmail && <p style={{ fontSize: '.8rem', color: 'var(--clr-navy)', marginTop: 8, fontWeight: 500 }}>Compte : {userEmail}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '2px solid var(--clr-gray-100)', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="QR Code MFA" style={{ width: 200, height: 200, display: 'block' }} />
              </div>
            </div>

            <div style={{ background: 'var(--clr-gray-50)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--clr-gray-600)', marginBottom: 10 }}>Comment procéder :</p>
              {['Ouvrez Google Authenticator sur votre téléphone','Appuyez sur "+" puis "Scanner un QR code"','Scannez le code ci-dessus','Entrez le code à 6 chiffres affiché dans l\'application'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, background: 'var(--clr-navy)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <p style={{ fontSize: '.82rem', color: 'var(--clr-gray-600)', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '.82rem', marginBottom: 16 }}>
                <IconAlert /> {errorMsg}
              </div>
            )}

            {successMsg ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '.875rem', fontWeight: 500 }}>
                <IconCheck /> {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <p style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--clr-gray-600)', marginBottom: 10, textAlign: 'center' }}>
                  Entrez le code à {TWO_FACTOR_CODE_LENGTH} chiffres
                </p>
                <div className="otp-container" style={{ justifyContent: 'center', marginBottom: 20 }}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { refs.current[i] = el; }}
                      type="text" inputMode="numeric" pattern="\d*"
                      maxLength={TWO_FACTOR_CODE_LENGTH} value={digit}
                      onChange={e => handleInput(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                      autoFocus={i === 0}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      disabled={isLoading}
                      className={['otp-input', digit ? 'otp-input--filled' : ''].join(' ')}
                    />
                  ))}
                </div>
                <Button type="submit" isLoading={isLoading} fullWidth disabled={!codeIsFull || isLoading}>
                  Activer et se connecter
                </Button>
              </form>
            )}

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.82rem', color: 'var(--clr-gray-400)' }}>
              <Link href={APP_ROUTES.LOGIN} style={{ color: 'var(--clr-navy)', fontWeight: 500 }}>Retour à la connexion</Link>
            </p>
          </div>
        </div>
        <footer style={{ marginTop: 24, textAlign: 'center', fontSize: '.72rem', color: 'var(--clr-gray-400)' }}>
          © {new Date().getFullYear()} MINFI – République du Cameroun
        </footer>
      </main>
    </div>
  );
}