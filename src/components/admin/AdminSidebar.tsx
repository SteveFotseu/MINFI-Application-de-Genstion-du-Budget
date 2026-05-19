'use client';

// ============================================================
// FICHIER  : src/components/admin/AdminSidebar.tsx
// RÔLE     : Sidebar partagée par toutes les pages de l'espace admin.
// USAGE    : <AdminSidebar active="users" />
//            <AdminSidebar active="agents" />
// ============================================================

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';

// ── Icônes ──────────────────────────────────────────────────
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconBadge   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;
const IconLogout  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export type AdminSection = 'users' | 'agents' | null;

interface Props {
  /** Section active dans la sidebar (pour highlight). */
  active?: AdminSection;
  /** Nom complet de l'admin connecté (affiché dans le bloc bas). */
  adminName?: string;
  /** Compteur facultatif à afficher en pastille rouge sur "Utilisateurs". */
  usersCount?: number;
  /** Compteur facultatif à afficher en pastille rouge sur "Agents". */
  agentsCount?: number;
}

export default function AdminSidebar({ active = null, adminName, usersCount, agentsCount }: Props) {
  const router = useRouter();

  const items = [
    {
      key:    'users' as const,
      label:  'Gérer les utilisateurs',
      href:   APP_ROUTES.ADMIN_DASHBOARD,
      icon:   <IconUsers />,
      count:  usersCount,
    },
    {
      key:    'agents' as const,
      label:  'Gérer les agents',
      href:   APP_ROUTES.ADMIN_AGENTS,
      icon:   <IconBadge />,
      count:  agentsCount,
    },
  ];

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', zIndex: 50,
    }}>
      {/* En-tête */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', overflow: 'hidden', flexShrink: 0 }}>
            <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>

        {items.map(item => {
          const isActive = active === item.key;
          return (
            <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,.15)' : '1px solid transparent',
                transition: 'background .12s',
              }}>
                <span style={{ color: isActive ? '#FCD116' : 'rgba(255,255,255,.55)', display: 'flex' }}>{item.icon}</span>
                <span style={{ fontSize: '.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,.6)' }}>
                  {item.label}
                </span>
                {isActive && typeof item.count === 'number' && item.count > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '.65rem', background: '#CE1126', color: '#fff', borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Carte admin connecté */}
        {adminName && (
          <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }}>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Connecté en tant que</p>
            <p style={{ fontSize: '.82rem', color: '#FCD116', fontWeight: 600 }}>{adminName}</p>
            <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Administrateur système</p>
          </div>
        )}
      </nav>

      {/* Pied */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <button
          onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}
        >
          <IconLogout /> Déconnexion
        </button>
      </div>

      {/* Bande tricolore Cameroun */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
        <div style={{ background: '#007A3D' }} />
        <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
        </div>
        <div style={{ background: '#FCD116' }} />
      </div>
    </aside>
  );
}