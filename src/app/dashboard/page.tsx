'use client';

// ============================================================
// FICHIER  : src/app/dashboard/page.tsx
// RÔLE     : Page d'accueil après connexion réussie.
//
// NAVIGATION :
//   - Avatar cliquable (initiales) → /profile (voir et modifier le profil)
//   - Bouton "Déconnexion" dans la navbar → déconnecte l'utilisateur
//
// SÉCURITÉ (côté client) :
//   - Vérifie la présence du JWT dans localStorage
//   - Si absent → redirection vers /login
// ============================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image         from 'next/image';
import Link          from 'next/link';
import { getAccessToken, clearTokens } from '@/lib/authService';
import { APP_ROUTES }                  from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// COMPOSANT AVATAR PROFIL (inline — clique → /profile)
// ⚠️  TODO back-end : remplacer firstName/lastName/role par les
//     données décodées du JWT ou d'un appel GET /api/v1/users/me
// ─────────────────────────────────────────────────────────────

/**
 * Couleur de l'avatar selon le rôle de l'utilisateur.
 * Sera dynamique une fois le back-end connecté.
 */
const ROLE_GRADIENT: Record<string, string> = {
  'Ordonnateur':          'linear-gradient(135deg, #0D2B55, #1A3A6B)',
  'Contrôleur financier': 'linear-gradient(135deg, #005A2D, #009A4E)',
  'Comptable':            'linear-gradient(135deg, #5B21B6, #7C3AED)',
  'Administrateur':       'linear-gradient(135deg, #8B0914, #CE1126)',
};

interface ProfileAvatarInlineProps {
  firstName: string;
  lastName:  string;
  role?:     string;
  email?:    string;
}

/**
 * Avatar cliquable dans la navbar.
 * Affiche les INITIALES de l'utilisateur connecté.
 * Au clic → redirige vers /profile pour voir/modifier ses infos.
 * Inclut un mini-dropdown avec "Mon profil" et "Déconnexion".
 *
 * ⚠️  Le bouton "Déconnexion" principal reste dans la navbar
 *     pour un accès direct sans ouvrir le dropdown.
 */
function ProfileAvatarInline({ firstName, lastName, role = '', email = '' }: ProfileAvatarInlineProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Initiales de l'utilisateur (ex: "Aminata Bello" → "AB")
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const gradient = ROLE_GRADIENT[role] ?? 'linear-gradient(135deg, #0D2B55, #1A3A6B)';

  const handleLogout = () => {
    setIsOpen(false);
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* ── Bouton avatar : affiche les initiales, clique ouvre le dropdown ── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Menu profil utilisateur"
        aria-expanded={isOpen}
        title={`${firstName} ${lastName} — Voir mon profil`}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,.1)',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: 999,
          padding: '4px 10px 4px 4px',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
      >
        {/* Cercle avec initiales — couleur selon le rôle */}
        <div style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '.82rem', fontWeight: 700,
          border: '2px solid rgba(255,255,255,.3)',
          flexShrink: 0,
        }}>
          {initials}
        </div>

        {/* Prénom + rôle */}
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            {firstName}
          </p>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)', marginTop: 1 }}>
            {role || 'Utilisateur'}
          </p>
        </div>

        {/* Chevron */}
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,.6)" strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .2s ease',
          }}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {/* ── Dropdown menu ── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 230,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,.18)',
          border: '1px solid #E8ECF0',
          overflow: 'hidden',
          zIndex: 300,
          animation: 'fadeSlideDown .2s cubic-bezier(.22,.68,0,1.2)',
        }}>

          {/* En-tête : identité de l'utilisateur */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(13,43,85,.04)',
            borderBottom: '1px solid #E8ECF0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Grand avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '.9rem', fontWeight: 700, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: '.875rem', fontWeight: 700, color: '#0D2B55',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {firstName} {lastName}
                </p>
                {email && (
                  <p style={{
                    fontSize: '.7rem', color: '#8E9BAA',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {email}
                  </p>
                )}
                {role && (
                  <span style={{
                    display: 'inline-block', marginTop: 3,
                    fontSize: '.65rem', fontWeight: 600, color: '#0D2B55',
                    background: 'rgba(13,43,85,.08)', padding: '1px 7px', borderRadius: 999,
                  }}>
                    {role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options du menu */}
          <div style={{ padding: '6px 0' }}>

            {/* ✅ MON PROFIL → redirige vers /profile */}
            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <button style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '.85rem',
                color: '#1A202C', fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F6FA')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {/* Icône profil */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D2B55" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Mon profil
              </button>
            </Link>

            {/* Séparateur */}
            <div style={{ height: 1, background: '#E8ECF0', margin: '4px 0' }} />

            {/* Déconnexion depuis le dropdown */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '.85rem',
                color: '#CE1126', fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {/* Icône déconnexion */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CE1126" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODULES BUDGÉTAIRES (placeholder — à remplacer par les vrais)
// ─────────────────────────────────────────────────────────────
const MODULES = [
  { icon: '📊', title: "Budget de l'État",   description: 'Consultation et suivi du budget général',    color: 'var(--clr-navy)',       bg: 'rgba(13,43,85,.06)'  },
  { icon: '💰', title: 'Recettes',            description: 'Suivi des recettes budgétaires',              color: 'var(--clr-green)',      bg: 'rgba(0,122,61,.06)'  },
  { icon: '📋', title: 'Dépenses',            description: 'Gestion des dépenses publiques',              color: 'var(--clr-red)',        bg: 'rgba(206,17,38,.06)' },
  { icon: '📈', title: 'Rapports',            description: 'Génération de rapports financiers',           color: 'var(--clr-yellow-dark)', bg: 'rgba(212,168,0,.06)' },
  { icon: '🏛️', title: 'Programmes',          description: 'Suivi des programmes budgétaires',            color: 'var(--clr-navy-mid)',   bg: 'rgba(26,58,107,.06)' },
  { icon: '⚙️', title: 'Administration',      description: 'Paramètres et configuration',                 color: 'var(--clr-gray-600)',   bg: 'rgba(74,85,104,.06)' },
];

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router  = useRouter();
  const [isReady, setIsReady] = useState(false);

  // ── Vérification de l'authentification côté client ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }
    setIsReady(true);
  }, [router]);

  // ── Déconnexion depuis le bouton principal de la navbar ──
  const handleLogout = () => {
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  // Écran de chargement
  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-off-white)', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center', color: 'var(--clr-gray-400)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--clr-gray-200)', borderTopColor: 'var(--clr-navy)', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 16px' }} />
          Chargement de votre espace…
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-off-white)', fontFamily: 'var(--font-body)', color: 'var(--clr-gray-800)' }}>

      {/* ══════════════════════════════════════
          BARRE DE NAVIGATION
          ══════════════════════════════════════ */}
      <nav style={{
        background: 'linear-gradient(135deg, var(--clr-navy) 0%, var(--clr-navy-mid) 100%)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        boxShadow: '0 2px 16px rgba(13,43,85,.30)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo + nom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/images/logo-minfi.png" alt="MINFI" width={36} height={36}
            style={{ borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.3)' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              GBE – MINFI
            </p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)', letterSpacing: '.05em' }}>
              Gestion du Budget Général de l&apos;État
            </p>
          </div>
        </div>

        {/* Navigation centrale */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Accueil', 'Budget', 'Rapports'].map(item => (
            <button key={item} style={{
              background: item === 'Accueil' ? 'rgba(255,255,255,.12)' : 'transparent',
              border: 'none', color: '#fff', fontSize: '.82rem', fontWeight: 500,
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              {item}
            </button>
          ))}
        </div>

        {/* Droite : avatar profil + bouton déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* ✅ AVATAR PROFIL — initiales de l'utilisateur connecté
              Clic → dropdown avec "Mon profil" (→ /profile) et "Déconnexion"
              ⚠️  TODO back-end : remplacer les valeurs hardcodées par les
                  données réelles du JWT décodé ou de l'appel GET /api/v1/users/me */}
          <ProfileAvatarInline
            firstName="Aminata"
            lastName="Bello"
            role="Contrôleur financier"
            email="a.bello@minfi.cm"
          />

          {/* ✅ BOUTON DÉCONNEXION PRINCIPAL — toujours visible dans la navbar */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff', fontSize: '.82rem', fontWeight: 500,
              padding: '7px 14px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(206,17,38,.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          CONTENU PRINCIPAL
          ══════════════════════════════════════ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Bannière de bienvenue */}
        <div style={{
          background: 'linear-gradient(135deg, var(--clr-navy) 0%, var(--clr-navy-mid) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 40px',
          marginBottom: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(13,43,85,.20)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Motifs décoratifs */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(252,209,22,.06)', pointerEvents: 'none' }} />
          {/* Bandes tricolores en bas */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style={{ background: 'var(--clr-green)' }} />
            <div style={{ background: 'var(--clr-red)' }} />
            <div style={{ background: 'var(--clr-yellow)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'var(--clr-yellow)', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Bienvenue sur la plateforme
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Gestion du Budget Général de l&apos;État
            </h1>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.875rem' }}>
              Ministère des Finances du Cameroun • Exercice budgétaire {new Date().getFullYear()}
            </p>
          </div>

          <Image src="/images/logo-minfi.png" alt="MINFI" width={80} height={80}
            style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', position: 'relative', zIndex: 1, opacity: .9 }} />
        </div>

        {/* Indicateur page en développement */}
        <div style={{
          background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-md)',
          padding: '12px 16px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '.82rem', color: '#9A3412',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            <strong>Tableau de bord en développement</strong> — Vous êtes connecté avec succès.
            Les modules ci-dessous seront disponibles dans les prochaines versions.
          </span>
        </div>

        {/* Grille des modules */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--clr-navy)', marginBottom: 20 }}>
          Modules disponibles
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px',
              boxShadow: 'var(--shadow-sm)', border: '1px solid var(--clr-gray-100)',
              display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'default',
              transition: 'transform .2s, box-shadow .2s',
              animation: `cardReveal .4s ${i * .06}s cubic-bezier(.22,.68,0,1.2) both`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: 48, height: 48, background: mod.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {mod.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '.9rem', fontWeight: 600, color: mod.color, marginBottom: 4 }}>{mod.title}</h3>
                <p style={{ fontSize: '.8rem', color: 'var(--clr-gray-400)', lineHeight: 1.5 }}>{mod.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Loi de référence */}
        <div style={{
          marginTop: 40, padding: '16px 20px',
          background: 'rgba(13,43,85,.04)', borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(13,43,85,.08)', fontSize: '.75rem', color: 'var(--clr-gray-400)',
          textAlign: 'center', fontStyle: 'italic',
        }}>
          Application développée conformément à la Loi N° 2018/012 du 11 Juillet 2018
          portant régime financier de l&apos;État et des autres entités publiques
          – République du Cameroun
        </div>
      </main>
    </div>
  );
}