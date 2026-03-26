'use client';

// ============================================================
// FICHIER  : src/app/ordonnateur/dashboard/page.tsx
// RÔLE     : Dashboard de l'Ordonnateur (fictif — à développer)
// ============================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';

export default function OrdonnateurDashboard() {
  const router  = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; section: string; programme: string } | null>(null);

  useEffect(() => {
    if (!getAccessToken()) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (ctx) {
      const aff = ctx.affectations?.[0];
      setUser({ firstName: ctx.firstName, lastName: ctx.lastName, section: aff?.sectionLibelle ?? '', programme: aff?.programmeLibelle ?? '' });
    }
  }, [router]);

  const handleLogout = () => { clearTokens(); router.push(APP_ROUTES.LOGIN); };

  const MOCK_STATS = [
    { label: 'Budget alloué',  value: '500 000 000',  unit: 'FCFA', color: '#0D2B55', icon: '🏦' },
    { label: 'Déjà engagé',    value: '320 000 000',  unit: 'FCFA', color: '#D97706', icon: '📋' },
    { label: 'Disponible',     value: '180 000 000',  unit: 'FCFA', color: '#007A3D', icon: '✅' },
    { label: 'Demandes en cours', value: '5',         unit: 'dossiers', color: '#CE1126', icon: '⏳' },
  ];

  const MOCK_DEMANDES = [
    { id: 'D-2026-001', objet: 'Achat matériel informatique', montant: '25 000 000', statut: 'approuvé',   date: '2026-03-20' },
    { id: 'D-2026-002', objet: 'Formation du personnel',      montant: '8 000 000',  statut: 'en_attente', date: '2026-03-22' },
    { id: 'D-2026-003', objet: 'Réfection des bureaux',       montant: '45 000 000', statut: 'rejeté',     date: '2026-03-18' },
    { id: 'D-2026-004', objet: 'Acquisition véhicules',       montant: '90 000 000', statut: 'en_attente', date: '2026-03-24' },
  ];

  const STATUT = {
    approuvé:   { label: '✅ Approuvé',   color: '#166534', bg: '#F0FDF4' },
    en_attente: { label: '⏳ En attente', color: '#92400E', bg: '#FFFBEB' },
    rejeté:     { label: '❌ Rejeté',     color: '#991B1B', bg: '#FEF2F2' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* Navbar */}
      <nav style={{ background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(13,43,85,.3)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/images/logo-minfi.png" alt="MINFI" width={36} height={36} style={{ borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.3)' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>GBE – MINFI</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)' }}>Espace Ordonnateur</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '4px 12px 4px 4px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.78rem', fontWeight: 700 }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div><p style={{ fontSize: '.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{user.firstName}</p><p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)' }}>Ordonnateur</p></div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(206,17,38,.2)', border: '1px solid rgba(206,17,38,.4)', color: '#fff', fontSize: '.82rem', fontWeight: 500, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
        </div>
      </nav>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}><div style={{ background: '#007A3D' }}/><div style={{ background: '#CE1126' }}/><div style={{ background: '#FCD116' }}/></div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Bannière */}
        <div style={{ background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', borderRadius: 16, padding: '24px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(13,43,85,.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}><div style={{ background: '#007A3D' }}/><div style={{ background: '#CE1126' }}/><div style={{ background: '#FCD116' }}/></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: '#FCD116', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Tableau de bord</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Bienvenue, {user?.firstName ?? '…'} 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem' }}>{user?.section ?? ''} • {user?.programme ?? ''}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '10px 20px', position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.7rem', marginBottom: 2 }}>Exercice budgétaire</p>
            <p style={{ color: '#FCD116', fontWeight: 700, fontSize: '1.1rem' }}>{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {MOCK_STATS.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #E8ECF0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color }} />
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 4 }}>{s.unit}</p>
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '1.5rem', opacity: .4 }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Section en construction + tableau demandes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Tableau des demandes */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Mes demandes récentes</h2>
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>Suivi de vos engagements budgétaires</p>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                + Nouvelle demande
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#F8F9FB' }}>
                {['N° Dossier', 'Objet', 'Montant (FCFA)', 'Statut', 'Date'].map(col => (
                  <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid #E8ECF0' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {MOCK_DEMANDES.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F0F2F5' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#4A5568', background: '#F0F2F5', padding: '2px 8px', borderRadius: 4 }}>{d.id}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: '.85rem', color: '#1A202C' }}>{d.objet}</td>
                    <td style={{ padding: '12px 16px', fontSize: '.85rem', color: '#1A202C', fontWeight: 600 }}>{d.montant}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, color: STATUT[d.statut as keyof typeof STATUT].color, background: STATUT[d.statut as keyof typeof STATUT].bg }}>
                        {STATUT[d.statut as keyof typeof STATUT].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#8E9BAA' }}>{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panneau "En développement" */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.06)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Prochaines fonctionnalités</h2>
            {['Formulaire d\'engagement', 'Suivi en temps réel', 'Notifications', 'Rapports budgétaires', 'Export PDF/Excel'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, border: '1px solid #E8ECF0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCD116', flexShrink: 0 }} />
                <p style={{ fontSize: '.82rem', color: '#4A5568' }}>{f}</p>
                <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: '#8E9BAA', background: '#E8ECF0', padding: '1px 6px', borderRadius: 999 }}>Bientôt</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}