'use client';

// ============================================================
// FICHIER  : src/app/two-factor/page.tsx
// RÔLE     : Page de vérification du code TOTP (2FA).
//
// FLUX :
//   1. L'utilisateur arrive ici après une connexion réussie
//      qui a retourné mfaRequired=true
//   2. L'email de l'utilisateur a été stocké dans sessionStorage
//      par la page de login (clé : 'gbe_email_2fa')
//   3. L'utilisateur saisit le code à 6 chiffres généré par
//      son application TOTP (Google Authenticator, Authy…)
//   4. Appel POST /api/v1/auth/verify avec { email, code }
//   5. Si code correct → accessToken reçu → stocké → redirection
//      vers le dashboard correspondant au roleSysteme de l'utilisateur
//   6. Si code incorrect → message d'erreur affiché
//
// ── MODIFICATION APPORTÉE ──────────────────────────────────
//   Après vérification 2FA réussie, on lit le roleSysteme dans
//   la réponse via : response.userContext.affectations[0].roleSysteme
//   Puis on redirige vers le dashboard correspondant grâce à
//   ROLE_DASHBOARD_ROUTES[roleSysteme].
//   On sauvegarde aussi le userContext complet (saveUserContext)
//   pour que les dashboards puissent afficher le nom, rôle, etc.
// ──────────────────────────────────────────────────────────
//
// SÉCURITÉ :
//   - Si aucun email en sessionStorage → redirection vers /login
//   - Le code OTP expire côté back-end (pas besoin de minuterie)
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout    from '@/components/auth/AuthLayout';
import Button        from '@/components/ui/Button';
import {
  verifyTwoFactor,
  saveAccessToken,
  saveUserContext,   // ← NOUVEAU : sauvegarde le contexte utilisateur complet
} from '@/lib/authService';
import {
  APP_ROUTES,
  TWO_FACTOR_CODE_LENGTH,
  ROLE_DASHBOARD_ROUTES,  // ← NOUVEAU : mapping rôle → route dashboard
} from '@/constants/auth';

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
const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT PAGE
// ─────────────────────────────────────────────────────────────
export default function TwoFactorPage() {
  const router = useRouter();

  // Tableau de 6 chaînes, une par case OTP
  const [otp, setOtp]               = useState<string[]>(Array(TWO_FACTOR_CODE_LENGTH).fill(''));
  const [hasError, setHasError]     = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // Email récupéré depuis sessionStorage (stocké par la page login)
  const [userEmail, setUserEmail] = useState('');

  // Références sur les inputs pour le focus automatique
  const refs = useRef<Array<HTMLInputElement | null>>(
    Array(TWO_FACTOR_CODE_LENGTH).fill(null)
  );

  // ── Récupérer l'email depuis sessionStorage ──
  useEffect(() => {
    const email = sessionStorage.getItem('gbe_email_2fa');
    if (!email) {
      // Aucun email trouvé → l'utilisateur n'est pas passé par le login
      // → rediriger pour éviter une page inutilisable
      router.replace(APP_ROUTES.LOGIN);
      return;
    }
    setUserEmail(email);
  }, [router]);

  // Indique si toutes les cases OTP sont remplies
  const codeIsFull = otp.every(c => c !== '');

  // Code OTP complet sous forme de chaîne (ex: "123456")
  const otpValue = otp.join('');

  // ── Gestion de la saisie case par case ──
  const handleInput = useCallback((index: number, raw: string) => {
    // Accepter uniquement les chiffres
    if (!/^\d*$/.test(raw)) return;

    // Réinitialiser l'état d'erreur à chaque saisie
    setHasError(false);
    setErrorMsg('');

    const next = [...otp];

    // Cas collage : l'utilisateur colle un code entier (ex: "123456")
    if (raw.length > 1) {
      // Extraire uniquement les chiffres et limiter à TWO_FACTOR_CODE_LENGTH
      const digits = raw.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH);
      for (let i = 0; i < TWO_FACTOR_CODE_LENGTH; i++) {
        next[i] = digits[i] ?? '';
      }
      setOtp(next);
      // Placer le focus sur la dernière case remplie
      refs.current[Math.min(digits.length, TWO_FACTOR_CODE_LENGTH - 1)]?.focus();
      return;
    }

    // Saisie normale : un chiffre à la fois
    next[index] = raw;
    setOtp(next);

    // Auto-focus sur la case suivante après saisie d'un chiffre
    if (raw && index < TWO_FACTOR_CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, [otp]);

  // ── Gestion des touches spéciales (Backspace, flèches) ──
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Effacer uniquement la case courante
        const next = [...otp]; next[index] = ''; setOtp(next);
      } else if (index > 0) {
        // Si la case est déjà vide, reculer à la case précédente
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Navigation clavier vers la gauche
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < TWO_FACTOR_CODE_LENGTH - 1) {
      // Navigation clavier vers la droite
      refs.current[index + 1]?.focus();
    }
  }, [otp]);

  // ── Soumission du code TOTP ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ne soumettre que si les 6 cases sont remplies
    if (!codeIsFull) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');

    try {
      // ── Appel POST /api/v1/auth/verify avec { email, code } ──
      const response = await verifyTwoFactor({
        email: userEmail,
        code:  otpValue,
      });

      // ── Vérification que l'accessToken est présent dans la réponse ──
      if (response.accessToken) {

        // 1. Sauvegarder le JWT d'accès dans localStorage
        //    (utilisé par les pages protégées pour vérifier l'authentification)
        saveAccessToken(response.accessToken);

        // 2. Sauvegarder le userContext complet dans localStorage ← NOUVEAU
        //    (contient firstName, lastName, email, affectations avec roleSysteme)
        //    Utilisé par les dashboards pour afficher les infos de l'utilisateur
        if (response.userContext) {
          saveUserContext(response.userContext);
        }

        // 3. Déterminer le rôle de l'utilisateur ← NOUVEAU
        //    On lit le roleSysteme dans la première affectation active.
        //    affectations[0] est suffisant car un utilisateur a généralement
        //    une seule affectation principale active.
        const affectations = response.userContext?.affectations ?? [];

        // Chercher la première affectation active (actif === true)
        // Si aucune n'est active, prendre la première disponible
        const affectationActive =
          affectations.find(a => a.actif) ?? affectations[0];

        // Extraire le roleSysteme (ex: "ADMIN", "ORDONNATEUR_PRINCIPAL"…)
        const roleSysteme = affectationActive?.roleSysteme;

        // 4. Résoudre la route du dashboard correspondant au rôle ← NOUVEAU
        //    ROLE_DASHBOARD_ROUTES est un dictionnaire défini dans constants/auth.ts
        //    Si le rôle est inconnu ou absent, on redirige vers /dashboard (fallback)
        const dashboardRoute =
          roleSysteme
            ? (ROLE_DASHBOARD_ROUTES[roleSysteme] ?? APP_ROUTES.DASHBOARD)
            : APP_ROUTES.DASHBOARD;

        // 5. Afficher un message de succès avant la redirection
        setSuccessMsg('Code vérifié avec succès ! Connexion en cours…');

        // 6. Nettoyer l'email temporaire du sessionStorage
        sessionStorage.removeItem('gbe_email_2fa');

        // 7. Rediriger vers le dashboard du rôle après un court délai
        //    Le délai permet à l'utilisateur de voir le message de succès
        setTimeout(() => router.push(dashboardRoute), 1200);

      } else {
        // Réponse inattendue du back-end : pas d'accessToken
        setHasError(true);
        setErrorMsg(response.message || 'Code incorrect. Veuillez réessayer.');
      }

    } catch (err) {
      // Erreur réseau ou code invalide retourné par le back-end
      setHasError(true);
      setErrorMsg(
        err instanceof Error ? err.message : 'Code invalide ou expiré.'
      );

      // Réinitialiser toutes les cases pour faciliter la nouvelle saisie
      setOtp(Array(TWO_FACTOR_CODE_LENGTH).fill(''));

      // Remettre le focus sur la première case
      refs.current[0]?.focus();
    } finally {
      // Toujours désactiver le chargement, qu'il y ait erreur ou succès
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Vérification en deux étapes"
      subtitle="Saisissez le code à 6 chiffres de votre application d'authentification"
    >
      {/* ── Alerte d'erreur (code incorrect, réseau…) ── */}
      {errorMsg && (
        <div className="alert alert--error" role="alert">
          <IconAlert /> {errorMsg}
        </div>
      )}

      {/* ── Alerte de succès (code vérifié, redirection en cours) ── */}
      {successMsg && (
        <div className="alert alert--success" role="status">
          <IconCheck /> {successMsg}
        </div>
      )}

      {/* ── Affichage de l'email pour confirmation ── */}
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

          {/* ── Cases OTP ── */}
          <div>
            <p style={{
              fontSize: '.8125rem', fontWeight: 600,
              color: 'var(--clr-gray-600)', marginBottom: '12px',
            }}>
              Code à {TWO_FACTOR_CODE_LENGTH} chiffres (Microsoft Authenticator)
            </p>

            {/* Conteneur des cases OTP avec rôle ARIA pour l'accessibilité */}
            <div
              className="otp-container"
              role="group"
              aria-label={`Code de vérification à ${TWO_FACTOR_CODE_LENGTH} chiffres`}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  // Stocker la référence pour le focus automatique
                  ref={el => { refs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"   // Clavier numérique sur mobile
                  pattern="\d*"         // HTML validation : chiffres uniquement
                  maxLength={TWO_FACTOR_CODE_LENGTH} // Permet le collage du code entier
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()} // Sélectionner le contenu au focus
                  autoFocus={i === 0}   // Focus automatique sur la première case
                  // Autocomplétion OTP sur mobile (SMS OTP, etc.)
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  // Désactiver les cases pendant le chargement ou après succès
                  disabled={isLoading || !!successMsg}
                  aria-label={`Chiffre ${i + 1} du code`}
                  className={[
                    'otp-input',
                    digit    ? 'otp-input--filled' : '',  // Case remplie : fond vert
                    hasError ? 'otp-input--error'  : '',  // Erreur : fond rouge + animation shake
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          {/* ── Bouton vérifier ── */}
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            // Désactiver si les 6 cases ne sont pas toutes remplies,
            // si un chargement est en cours, ou si le code a déjà été validé
            disabled={!codeIsFull || isLoading || !!successMsg}
          >
            Vérifier le code
          </Button>

          {/* ── Lien retour vers la page de connexion ── */}
          <div style={{
            textAlign: 'center',
            borderTop: '1px solid var(--clr-gray-100)',
            paddingTop: '14px',
          }}>
            <Link href={APP_ROUTES.LOGIN} style={{
              fontSize: '.8rem',
              color: 'var(--clr-gray-400)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <IconArrowLeft /> Retour à la connexion
            </Link>
          </div>

        </div>
      </form>
    </AuthLayout>
  );
}