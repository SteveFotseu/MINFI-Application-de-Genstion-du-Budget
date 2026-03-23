// ============================================================
// FICHIER  : src/components/ui/ProfileAvatar.tsx
//
// RÔLE     : Icône de profil cliquable dans la navbar du dashboard.
//            Affiche les initiales de l'utilisateur connecté.
//            Au clic → redirige vers /profile
//
// USAGE dans src/app/dashboard/page.tsx :
//   import ProfileAvatar from '@/components/ui/ProfileAvatar';
//   <ProfileAvatar firstName="Aminata" lastName="Bello" role="Contrôleur financier" />
//
// ⚠️  TODO back-end : remplacer les props par les données
//     du token JWT décodé ou d'un appel GET /api/v1/users/me
// ============================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link  from 'next/link';
import { useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/authService';
import { APP_ROUTES }  from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────
interface ProfileAvatarProps {
  firstName: string;
  lastName:  string;
  role?:     string;
  email?:    string;
}

// Couleurs par rôle (initiales de l'avatar)
const ROLE_GRADIENT: Record<string, string> = {
  'Ordonnateur':          'linear-gradient(135deg, #0D2B55, #1A3A6B)',
  'Contrôleur financier': 'linear-gradient(135deg, #005A2D, #009A4E)',
  'Comptable':            'linear-gradient(135deg, #5B21B6, #7C3AED)',
  'Administrateur':       'linear-gradient(135deg, #8B0914, #CE1126)',
};

// Icônes inline
const IconUser    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconLogout  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconChevron = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9"/></svg>;

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ firstName, lastName, role = '', email = '' }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const gradient = ROLE_GRADIENT[role] ?? 'linear-gradient(135deg, #0D2B55, #1A3A6B)';

  const handleLogout = () => {
    setIsOpen(false);
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>

      {/* Bouton avatar */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Menu profil"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
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
        {/* Cercle avec initiales */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '.8rem', fontWeight: 700,
          border: '2px solid rgba(255,255,255,.3)',
          flexShrink: 0,
        }}>
          {initials}
        </div>

        {/* Nom + rôle */}
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            {firstName}
          </p>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)', marginTop: 1 }}>
            {role || 'Utilisateur'}
          </p>
        </div>

        {/* Chevron */}
        <span style={{
          color: 'rgba(255,255,255,.6)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .2s ease',
          display: 'flex',
        }}>
          <IconChevron />
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 220,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,.18)',
          border: '1px solid #E8ECF0',
          overflow: 'hidden',
          animation: 'fadeSlideDown .2s cubic-bezier(.22,.68,0,1.2)',
          zIndex: 200,
        }}>

          {/* En-tête dropdown */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(13,43,85,.04)',
            borderBottom: '1px solid #E8ECF0',
          }}>
            {/* Avatar grand format */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '.9rem', fontWeight: 700,
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '.875rem', fontWeight: 700, color: '#0D2B55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {firstName} {lastName}
                </p>
                {email && (
                  <p style={{ fontSize: '.7rem', color: '#8E9BAA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {email}
                  </p>
                )}
                {role && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: 3,
                    fontSize: '.65rem', fontWeight: 600,
                    color: '#0D2B55',
                    background: 'rgba(13,43,85,.08)',
                    padding: '1px 7px', borderRadius: 999,
                  }}>
                    {role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options du menu */}
          <div style={{ padding: '6px 0' }}>
            {/* Voir mon profil */}
            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <button style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '.85rem',
                color: '#1A202C', fontWeight: 500,
                transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F6FA')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ color: '#0D2B55', display: 'flex' }}><IconUser /></span>
                Mon profil
              </button>
            </Link>

            {/* Séparateur */}
            <div style={{ height: 1, background: '#E8ECF0', margin: '4px 0' }} />

            {/* Déconnexion */}
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
                transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <IconLogout />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;