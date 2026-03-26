'use client';

// ============================================================
// FICHIER  : src/app/comptable/dashboard/page.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';

export default function ComptableDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; section: string } | null>(null);

  useEffect(() => {
    if (!getAccessToken()) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (ctx) setUser({ firstName: ctx.firstName, lastName: ctx.lastName, section: ctx.affectations?.[0]?.sectionLibelle ?? '' });
  }, [router]);

  const handleLogout = () => { clearTokens(); router.push(APP_ROUTES.LOGIN); };

  const MOCK_STATS = [
    { label: 'Mandats à payer',   value: '8',           color: '#CE1126', icon: '📋', note: 'En attente' },
    { label: 'Total à décaisser', value: '48 000 000',  color: '#0D2B55', icon: '💰', note: 'FCFA' },
    { label: 'Payé ce mois',      value: '156 000 000', color: '#007A3D', icon: '✅', note: 'FCFA — 23 mandats' },
    { label: 'Taux exécution',    value: '67%',         color: '#D97706', icon: '📊', note: 'Budget consommé' },
  ];

  const MOCK_MANDATS = [
    { id: 'M-2026-012', beneficiaire: 'SOCALTECH SARL',       objet: 'Achat matériel informatique', montant: '25 000 000', dateVisee: '2026-03-20' },
    { id: 'M-2026-013', beneficiaire: 'MINPOSTEL',             objet: 'Services télécoms',           montant: '8 000 000',  dateVisee: '2026-03-22' },
    { id: 'M-2026-014', beneficiaire: 'ENAM',                  objet: 'Formation du personnel',      montant: '15 000 000', dateVisee: '2026-03-22' },
    { id: 'M-2026-015', beneficiaire: 'TRAVAUX PUBLICS SARL',  objet: 'Réfection bureaux',           montant: '0 000 000',  dateVisee: '2026-03-24' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      <nav style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(91,33,182,.3)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/images/logo-minfi.png" alt="MINFI" width={36} height={36} style={{ borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.3)' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>GBE – MINFI</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.65)' }}>Espace Comptable</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '4px 12px 4px 4px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.78rem', fontWeight: 700 }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div><p style={{ fontSize: '.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{user.firstName}</p><p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.65)' }}>Comptable</p></div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: '.82rem', fontWeight: 500, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </button>
        </div>
      </nav>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}><div style={{ background: '#007A3D' }}/><div style={{ background: '#CE1126' }}/><div style={{ background: '#FCD116' }}/></div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Bannière */}
        <div style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', borderRadius: 16, padding: '24px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(91,33,182,.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}><div style={{ background: '#007A3D' }}/><div style={{ background: '#CE1126' }}/><div style={{ background: '#FCD116' }}/></div>
          <div>
            <p style={{ color: '#FCD116', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Tableau de bord</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Bienvenue, {user?.firstName ?? '…'} 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem' }}>{user?.section ?? ''} • Exécution des paiements</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '10px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.7rem', marginBottom: 2 }}>Exercice</p>
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
              <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 4 }}>{s.note}</p>
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '1.4rem', opacity: .4 }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Mandats à payer */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Mandats à exécuter</h2>
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>Dossiers visés par le Contrôleur Financier</p>
            </div>
            <button style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              📄 Rapport mensuel
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#F8F9FB' }}>
              {['N° Mandat', 'Bénéficiaire', 'Objet', 'Montant (FCFA)', 'Visé le', 'Action'].map(col => (
                <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid #E8ECF0' }}>{col}</th>
              ))}
            </tr></thead>
            <tbody>
              {MOCK_MANDATS.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #F0F2F5' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#4A5568', background: '#F0F2F5', padding: '2px 8px', borderRadius: 4 }}>{m.id}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: '.85rem', color: '#1A202C', fontWeight: 500 }}>{m.beneficiaire}</td>
                  <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#4A5568' }}>{m.objet}</td>
                  <td style={{ padding: '12px 16px', fontSize: '.85rem', color: '#1A202C', fontWeight: 600 }}>{m.montant}</td>
                  <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#8E9BAA' }}>{new Date(m.dateVisee).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ padding: '5px 14px', border: 'none', borderRadius: 6, background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', color: '#fff', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      💳 Payer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 24px', borderTop: '1px solid #E8ECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '.78rem', color: '#8E9BAA' }}>{MOCK_MANDATS.length} mandat(s) en attente de paiement</p>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>Au {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}