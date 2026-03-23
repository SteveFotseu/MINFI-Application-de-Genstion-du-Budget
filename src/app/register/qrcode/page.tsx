'use client';

// ============================================================
// FICHIER  : src/app/register/qrcode/page.tsx
// RÔLE     : Page QR code post-inscription avec validation TOTP
//            OBLIGATOIRE avant de continuer.
//
// FLUX SÉCURISÉ :
//   1. Affichage du QR code à scanner
//   2. Saisie obligatoire du code TOTP à 6 chiffres
//      (prouve que l'utilisateur a bien scanné et configuré l'app)
//   3. POST /api/v1/auth/verify { email, code }
//   4. Si code correct → redirection vers /login
//   5. Si code incorrect → message d'erreur, nouvelle saisie
//
// SÉCURITÉ :
//   - Impossible de passer à la suite sans code valide
//   - sessionStorage effacé après validation
//   - Redirection vers /register si pas de QR code
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image         from 'next/image';
import Link          from 'next/link';
import { verifyTwoFactor } from '@/lib/authService';
import { APP_ROUTES, TWO_FACTOR_CODE_LENGTH } from '@/constants/auth';

// ── Icônes ─────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// COMPOSANT PAGE
// ─────────────────────────────────────────────────────────────
export default function QrCodePage() {
  const router = useRouter();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail]  = useState<string>('');

  // État OTP
  const [otp, setOtp]           = useState<string[]>(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
  const [hasError, setHasError]  = useState(false);
  const [errorMsg, setErrorMsg]  = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const refs = useRef<Array<HTMLInputElement | null>>(
    Array(TWO_FACTOR_CODE_LENGTH).fill(null)
  );

  // ── Lecture sessionStorage ──
  useEffect(() => {
    const storedQr    = sessionStorage.getItem('gbe_qr_code');
    const storedEmail = sessionStorage.getItem('gbe_email_2fa');

    if (!storedQr) {
      router.replace(APP_ROUTES.REGISTER);
      return;
    }

    setQrCodeUrl(storedQr);
    setUserEmail(storedEmail ?? '');
  }, [router]);

  const codeIsFull = otp.every(c => c !== '');
  const otpValue   = otp.join('');

  // ── Gestion saisie OTP ──
  const handleInput = useCallback((index: number, raw: string) => {
    if (!/^\d*$/.test(raw)) return;

    setHasError(false);
    setErrorMsg('');

    const next = [...otp];

    // Collage d'un code entier
    if (raw.length > 1) {
      const digits = raw.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH);
      for (let i = 0; i < TWO_FACTOR_CODE_LENGTH; i++) {
        next[i] = digits[i] ?? '';
      }
      setOtp(next);
      refs.current[Math.min(digits.length, TWO_FACTOR_CODE_LENGTH - 1)]?.focus();
      return;
    }

    next[index] = raw;
    setOtp(next);
    if (raw && index < TWO_FACTOR_CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp]; next[index] = ''; setOtp(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft'  && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < TWO_FACTOR_CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, [otp]);

  // ── Soumission du code TOTP ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeIsFull || isLoading) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');

    try {
      const response = await verifyTwoFactor({
        email: userEmail,
        code:  otpValue,
      });

      // Le back-end répond 200 mais sans accessToken lors de la config initiale
      // (l'utilisateur n'est pas encore "connecté", juste en train de configurer)
      // On accepte toute réponse 200 comme succès de validation du code
      if (response.accessToken || response.success !== false) {
        setSuccessMsg('Code vérifié ! Votre application est configurée. Redirection…');

        // Nettoyage
        sessionStorage.removeItem('gbe_qr_code');
        sessionStorage.removeItem('gbe_email_2fa');

        setTimeout(() => router.push(APP_ROUTES.LOGIN), 1500);
      } else {
        setHasError(true);
        setErrorMsg(response.message || 'Code incorrect. Vérifiez votre application et réessayez.');
        setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
        refs.current[0]?.focus();
      }

    } catch (err) {
      setHasError(true);
      setErrorMsg(
        err instanceof Error ? err.message : 'Code invalide ou expiré. Réessayez.'
      );
      setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Chargement ──
  if (!qrCodeUrl) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-off-white)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--clr-gray-400)' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid var(--clr-gray-200)',
            borderTopColor: 'var(--clr-navy)',
            borderRadius: '50%',
            animation: 'spin .7s linear infinite',
            margin: '0 auto 16px',
          }} />
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-off-white)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── En-tête institutionnel ── */}
      <header style={{
        background: 'linear-gradient(160deg, var(--clr-navy) 0%, #091e3a 55%, var(--clr-navy-mid) 100%)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        boxShadow: '0 4px 24px rgba(13,43,85,.30)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div style={{ background: 'var(--clr-green)' }} />
          <div style={{ background: 'var(--clr-red)' }} />
          <div style={{ background: 'var(--clr-yellow)' }} />
        </div>
        <Image src="/images/logo-minfi.png" alt="MINFI" width={48} height={48}
          style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }} />
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>
            République du Cameroun
          </p>
          <p style={{ fontSize: '.75rem', color: 'var(--clr-yellow)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Ministère des Finances – GBE
          </p>
        </div>
        <Image src="/images/cameroon_flag.jpg" alt="Drapeau" width={60} height={40}
          style={{ borderRadius: 4, border: '1px solid rgba(255,255,255,.2)' }} />
      </header>

      {/* ── Contenu principal ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--clr-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          animation: 'cardReveal .45s cubic-bezier(.22,.68,0,1.2) both',
        }}>

          {/* Bande tricolore en haut */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--clr-green), var(--clr-yellow), var(--clr-red))' }} />

          <div style={{ padding: '32px' }}>

            {/* ── ÉTAPE 1 : Icône + Titre ── */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(13,43,85,.06)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid rgba(13,43,85,.12)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--clr-navy)" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9,12 11,14 15,10"/>
                </svg>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--clr-navy)',
                marginBottom: 6,
              }}>
                Configurez votre authentification
              </h1>
              <p style={{ fontSize: '.85rem', color: 'var(--clr-gray-400)', lineHeight: 1.6 }}>
                Suivez les deux étapes ci-dessous pour sécuriser votre compte.
              </p>
            </div>

            {/* ───────────────────────────────────────────
                ÉTAPE 1 : Scanner le QR code
            ─────────────────────────────────────────── */}
            <div style={{
              background: 'var(--clr-gray-50)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: 20,
              border: '1px solid var(--clr-gray-100)',
            }}>
              {/* Label étape */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}>
                <span style={{
                  width: 24, height: 24,
                  background: 'var(--clr-navy)',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>1</span>
                <p style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--clr-navy)' }}>
                  Scannez ce QR code avec votre application
                </p>
              </div>

              {/* QR Code centré */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{
                  padding: 12,
                  background: '#fff',
                  borderRadius: 10,
                  border: '2px solid var(--clr-gray-100)',
                  boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code d'authentification à deux facteurs"
                    style={{ width: 180, height: 180, display: 'block' }}
                  />
                </div>
              </div>

              {/* Apps compatibles */}
              <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--clr-gray-400)' }}>
                Compatible avec{' '}
                <strong style={{ color: 'var(--clr-gray-600)' }}>Google Authenticator</strong>,{' '}
                <strong style={{ color: 'var(--clr-gray-600)' }}>Authy</strong>,{' '}
                <strong style={{ color: 'var(--clr-gray-600)' }}>Microsoft Authenticator</strong>
              </p>
            </div>

            {/* ───────────────────────────────────────────
                ÉTAPE 2 : Saisie et validation du code
            ─────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{
                background: 'var(--clr-gray-50)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: 16,
                border: '1px solid var(--clr-gray-100)',
              }}>
                {/* Label étape */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}>
                  <span style={{
                    width: 24, height: 24,
                    background: codeIsFull ? 'var(--clr-green)' : 'var(--clr-navy)',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'background .2s',
                  }}>2</span>
                  <p style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--clr-navy)' }}>
                    Entrez le code à 6 chiffres affiché dans l&apos;application
                  </p>
                </div>

                {/* Alerte d'erreur */}
                {errorMsg && (
                  <div className="alert alert--error" role="alert" style={{ marginBottom: 12, fontSize: '.8rem' }}>
                    <IconAlert /> {errorMsg}
                  </div>
                )}

                {/* Alerte de succès */}
                {successMsg && (
                  <div className="alert alert--success" role="status" style={{ marginBottom: 12, fontSize: '.8rem' }}>
                    <IconCheck /> {successMsg}
                  </div>
                )}

                {/* Cases OTP */}
                <div
                  className="otp-container"
                  role="group"
                  aria-label={`Code de vérification à ${TWO_FACTOR_CODE_LENGTH} chiffres`}
                  style={{ marginBottom: 8 }}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { refs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={TWO_FACTOR_CODE_LENGTH}
                      value={digit}
                      onChange={e => handleInput(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      disabled={isLoading || !!successMsg}
                      aria-label={`Chiffre ${i + 1}`}
                      className={[
                        'otp-input',
                        digit    ? 'otp-input--filled' : '',
                        hasError ? 'otp-input--error'  : '',
                      ].join(' ')}
                    />
                  ))}
                </div>

                <p style={{ fontSize: '.72rem', color: 'var(--clr-gray-400)', textAlign: 'center' }}>
                  Le code change toutes les 30 secondes — saisissez-le rapidement
                </p>
              </div>

              {/* Bouton de validation — actif SEULEMENT si les 6 chiffres sont saisis */}
              <button
                type="submit"
                disabled={!codeIsFull || isLoading || !!successMsg}
                style={{
                  width: '100%',
                  height: 46,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '.9rem',
                  fontWeight: 600,
                  cursor: !codeIsFull || isLoading || !!successMsg ? 'not-allowed' : 'pointer',
                  background: !codeIsFull || isLoading || !!successMsg
                    ? 'var(--clr-gray-200)'
                    : 'linear-gradient(135deg, var(--clr-navy) 0%, var(--clr-navy-mid) 100%)',
                  color: !codeIsFull || isLoading || !!successMsg
                    ? 'var(--clr-gray-400)'
                    : '#fff',
                  boxShadow: !codeIsFull || isLoading || !!successMsg
                    ? 'none'
                    : '0 4px 16px rgba(13,43,85,.24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background .2s, box-shadow .2s, color .2s',
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin .65s linear infinite',
                    }} />
                    Vérification en cours…
                  </>
                ) : successMsg ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Validé !
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9,12 11,14 15,10"/>
                    </svg>
                    Valider et continuer
                  </>
                )}
              </button>

            </form>

            {/* Email affiché si disponible */}
            {userEmail && (
              <p style={{
                textAlign: 'center',
                marginTop: 14,
                fontSize: '.75rem',
                color: 'var(--clr-gray-400)',
              }}>
                Compte : <strong style={{ color: 'var(--clr-gray-600)' }}>{userEmail}</strong>
              </p>
            )}

            {/* Lien retour — uniquement si pas de succès */}
            {!successMsg && (
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: '.8rem', color: 'var(--clr-gray-400)' }}>
                Problème de configuration ?{' '}
                <Link href={APP_ROUTES.REGISTER} style={{ color: 'var(--clr-navy)', fontWeight: 500 }}>
                  Recommencer l&apos;inscription
                </Link>
              </p>
            )}

          </div>
        </div>

        {/* Pied de page */}
        <footer style={{ marginTop: 24, textAlign: 'center', fontSize: '.72rem', color: 'var(--clr-gray-400)' }}>
          © {new Date().getFullYear()} MINFI – République du Cameroun
        </footer>
      </main>
    </div>
  );
}