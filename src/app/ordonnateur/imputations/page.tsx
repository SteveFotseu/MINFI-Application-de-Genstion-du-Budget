'use client';

// ============================================================
// FICHIER  : src/app/ordonnateur/imputations/page.tsx
// RÔLE     : Liste des imputations budgétaires de l'ordonnateur.
//
// FONCTIONNALITÉS :
//   - Tableau paginé de toutes les imputations (filtrées par
//     section + exercice de l'ordonnateur connecté)
//   - Badges de statut colorés (BROUILLON/EN_ATTENTE/VALIDEE/REJETEE)
//   - Actions : Voir · Modifier (BROUILLON/REJETEE) · Soumettre · Supprimer
//   - Bouton "+ Nouvelle imputation" → /ordonnateur/imputations/nouvelle
//   - Filtre par statut
//   - Affichage du code d'imputation complet tronqué avec tooltip
//
// ⚠️  DONNÉES : Fakes data localStorage en attendant le back-end.
//     Dès que les routes API sont disponibles, remplacer les
//     fonctions loadImputations/deleteImputation par des fetch().
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';
import type { ImputationBudgetaire, StatutImputation } from '@/types/imputation';

// ─────────────────────────────────────────────────────────────
// CONSTANTES UI
// ─────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<StatutImputation, {
  label:   string;
  color:   string;
  bg:      string;
  border:  string;
  dot:     string;
}> = {
  BROUILLON:  { label: 'Brouillon',   color: '#4A5568', bg: '#F0F2F5', border: '#D1D8E0', dot: '#8E9BAA' },
  EN_ATTENTE: { label: 'En attente',  color: '#92400E', bg: '#FFFBEB', border: '#FCD116', dot: '#D97706' },
  VALIDEE:    { label: 'Validée',     color: '#166534', bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E' },
  REJETEE:    { label: 'Rejetée',     color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
};

// Clé localStorage pour les imputations (temp avant API)
const LS_KEY = 'gbe_imputations';

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG INLINE
// ─────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
    <path d="M9 8h6M9 11h4"/>
  </svg>
);

const Spinner = ({ size = 16, color = '#0D2B55' }: { size?: number; color?: string }) => (
  <span style={{
    display: 'inline-block', width: size, height: size, flexShrink: 0,
    border: '2px solid rgba(0,0,0,.1)', borderTopColor: color,
    borderRadius: '50%', animation: 'spin .65s linear infinite',
  }} />
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ImputationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<{
    firstName: string; lastName: string;
    section: string; exercice: string;
  } | null>(null);

  const [imputations,   setImputations]   = useState<ImputationBudgetaire[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filtreStatut,  setFiltreStatut]  = useState<StatutImputation | 'TOUS'>('TOUS');
  const [pendingIds,    setPendingIds]    = useState<Set<string>>(new Set());
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ImputationBudgetaire | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setPending = (id: string, pending: boolean) => {
    setPendingIds(prev => {
      const next = new Set(prev);
      pending ? next.add(id) : next.delete(id);
      return next;
    });
  };

  // ── Guard authentification ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }

    const ctx = getUserContext();
    if (!ctx) { router.replace(APP_ROUTES.LOGIN); return; }

    const aff = ctx.affectations?.find(a => a.actif) ?? ctx.affectations?.[0];
    const role = aff?.roleSysteme ?? '';
    if (!role.startsWith('ORDONNATEUR')) {
      router.replace(APP_ROUTES.DASHBOARD);
      return;
    }

    setUser({
      firstName: ctx.firstName,
      lastName:  ctx.lastName,
      section:   aff?.sectionLibelle ?? '',
      exercice:  String(new Date().getFullYear()),
    });
  }, [router]);

  // ── Chargement des imputations (localStorage pour l'instant) ──
  const loadImputations = useCallback(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      // Tri : plus récent en premier
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setImputations(all);
    } catch {
      setImputations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImputations(); }, [loadImputations]);

  // ── Soumettre une imputation BROUILLON → EN_ATTENTE ──
  const handleSoumettre = async (imp: ImputationBudgetaire) => {
    if (pendingIds.has(imp.id)) return;
    setPending(imp.id, true);
    try {
      // TODO: remplacer par fetch(IMPUTATION_ENDPOINTS.SOUMETTRE(imp.id), { method: 'POST' })
      await new Promise(r => setTimeout(r, 600)); // Simulation réseau

      const raw  = localStorage.getItem(LS_KEY);
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      const idx  = all.findIndex(i => i.id === imp.id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], statut: 'EN_ATTENTE', updatedAt: new Date().toISOString() };
        localStorage.setItem(LS_KEY, JSON.stringify(all));
      }

      setImputations(prev =>
        prev.map(i => i.id === imp.id
          ? { ...i, statut: 'EN_ATTENTE', updatedAt: new Date().toISOString() }
          : i,
        ),
      );
      showToast('Imputation soumise au Contrôleur Financier.');
    } catch {
      showToast('Erreur lors de la soumission.', 'error');
    } finally {
      setPending(imp.id, false);
    }
  };

  // ── Supprimer une imputation BROUILLON ──
  const handleDelete = (imp: ImputationBudgetaire) => {
    try {
      const raw  = localStorage.getItem(LS_KEY);
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(LS_KEY, JSON.stringify(all.filter(i => i.id !== imp.id)));
      setImputations(prev => prev.filter(i => i.id !== imp.id));
      setConfirmDelete(null);
      showToast('Imputation supprimée.');
    } catch {
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  // ── Filtrage ──
  const displayed = filtreStatut === 'TOUS'
    ? imputations
    : imputations.filter(i => i.statut === filtreStatut);

  // ── Compteurs par statut pour les filtres ──
  const counts = imputations.reduce<Record<string, number>>((acc, i) => {
    acc[i.statut] = (acc[i.statut] ?? 0) + 1;
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', zIndex: 50,
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>Espace Ordonnateur</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>

          {[
            { label: 'Tableau de bord',  href: APP_ROUTES.ORD_PRINCIPAL_DASHBOARD },
            { label: 'Imputations',       href: APP_ROUTES.ORD_IMPUTATIONS, active: true },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 12px', borderRadius: 8,
                background: item.active ? 'rgba(255,255,255,.12)' : 'transparent',
                border: item.active ? '1px solid rgba(255,255,255,.15)' : '1px solid transparent',
                cursor: 'pointer',
              }}>
                <span style={{
                  fontSize: '.85rem', fontWeight: item.active ? 600 : 400,
                  color: item.active ? '#fff' : 'rgba(255,255,255,.55)',
                }}>
                  {item.label}
                </span>
                {item.active && counts['EN_ATTENTE'] && (
                  <span style={{ marginLeft: 'auto', fontSize: '.65rem', background: '#CE1126', color: '#fff', borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
                    {counts['EN_ATTENTE']}
                  </span>
                )}
              </div>
            </Link>
          ))}

          {/* Infos section */}
          {user && (
            <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }}>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Exercice</p>
              <p style={{ fontSize: '.85rem', fontWeight: 700, color: '#FCD116', marginBottom: 6 }}>{user.exercice}</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Section</p>
              <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.3 }}>{user.section}</p>
            </div>
          )}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button
            onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8, background: 'rgba(255,255,255,.06)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '.82rem', fontWeight: 500, color: 'rgba(255,255,255,.6)',
            }}
          >
            <IconLogout /> Déconnexion
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }}/>
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </div>
          <div style={{ background: '#FCD116' }}/>
        </div>
      </aside>

      {/* ════════════ CONTENU ════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          background: '#fff', height: 64, padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
              Imputations budgétaires
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              {user?.section ?? '…'} · Exercice {user?.exercice ?? '…'}
            </p>
          </div>

          <Link href={APP_ROUTES.ORD_IMPUTATION_NOUVELLE} style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', border: 'none', borderRadius: 10,
              background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '.875rem', fontWeight: 600, color: '#fff',
              boxShadow: '0 4px 14px rgba(13,43,85,.25)',
            }}>
              <IconPlus /> Nouvelle imputation
            </button>
          </Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
        <div style={{ background: '#007A3D' }}/>
        <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="6" height="6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </div>
        <div style={{ background: '#FCD116' }}/>
      </div>

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>

          {/* ── Filtres par statut ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: '#8E9BAA', marginRight: 4 }}>
              <IconFilter /> Filtrer :
            </span>

            {(['TOUS', 'BROUILLON', 'EN_ATTENTE', 'VALIDEE', 'REJETEE'] as const).map(s => {
              const isActive = filtreStatut === s;
              const cfg = s !== 'TOUS' ? STATUT_CONFIG[s] : null;
              const count = s !== 'TOUS' ? (counts[s] ?? 0) : imputations.length;
              return (
                <button
                  key={s}
                  onClick={() => setFiltreStatut(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', border: `1.5px solid ${isActive ? (cfg?.border ?? '#0D2B55') : '#E8ECF0'}`,
                    borderRadius: 999, cursor: 'pointer',
                    background: isActive ? (cfg?.bg ?? 'rgba(13,43,85,.06)') : '#fff',
                    fontFamily: 'var(--font-body)', fontSize: '.78rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? (cfg?.color ?? '#0D2B55') : '#4A5568',
                    transition: 'all .15s',
                  }}
                >
                  {cfg && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  )}
                  {s === 'TOUS' ? 'Toutes' : STATUT_CONFIG[s as StatutImputation].label}
                  <span style={{ fontSize: '.7rem', opacity: .75 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* ── Tableau ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>

            {loading ? (
              <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <Spinner size={36} /><p style={{ fontSize: '.875rem' }}>Chargement…</p>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <div style={{ color: '#D1D8E0' }}><IconEmpty /></div>
                <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#4A5568' }}>
                  {filtreStatut === 'TOUS' ? 'Aucune imputation créée' : `Aucune imputation « ${STATUT_CONFIG[filtreStatut as StatutImputation].label} »`}
                </p>
                <p style={{ fontSize: '.8rem' }}>
                  {filtreStatut === 'TOUS' && 'Créez votre première imputation budgétaire.'}
                </p>
                {filtreStatut === 'TOUS' && (
                  <Link href={APP_ROUTES.ORD_IMPUTATION_NOUVELLE} style={{ textDecoration: 'none' }}>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 20px', border: 'none', borderRadius: 8,
                      background: '#0D2B55', color: '#fff', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600,
                    }}>
                      <IconPlus /> Créer une imputation
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FB' }}>
                      {['Libellé', 'Programme · Action', 'Code d\'imputation', 'Statut', 'Date', 'Actions'].map(col => (
                        <th key={col} style={{
                          padding: '10px 16px', textAlign: 'left',
                          fontSize: '.7rem', fontWeight: 600, color: '#8E9BAA',
                          letterSpacing: '.06em', textTransform: 'uppercase',
                          borderBottom: '1px solid #E8ECF0', whiteSpace: 'nowrap',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((imp, idx) => {
                      const cfg       = STATUT_CONFIG[imp.statut];
                      const isPending = pendingIds.has(imp.id);
                      const canEdit   = imp.statut === 'BROUILLON' || imp.statut === 'REJETEE';
                      const canSubmit = imp.statut === 'BROUILLON';
                      const canDelete = imp.statut === 'BROUILLON';

                      return (
                        <tr
                          key={imp.id}
                          style={{
                            borderBottom: idx < displayed.length - 1 ? '1px solid #F0F2F5' : 'none',
                            opacity: isPending ? 0.6 : 1,
                            transition: 'opacity .2s, background .15s',
                          }}
                          onMouseEnter={e  => { if (!isPending) e.currentTarget.style.background = '#F8F9FB'; }}
                          onMouseLeave={e  => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Libellé */}
                          <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                            <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {imp.libelle}
                            </p>
                            {imp.statut === 'REJETEE' && imp.motifRejet && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#991B1B', fontSize: '.72rem' }}>
                                <IconAlert />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                  {imp.motifRejet}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Programme · Action */}
                          <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                            <p style={{ fontSize: '.82rem', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {imp.programme.libelle}
                            </p>
                            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
                              Action {imp.action.code} · {imp.action.libelle}
                            </p>
                          </td>

                          {/* Code d'imputation — tronqué monospace */}
                          <td style={{ padding: '14px 16px' }}>
                            <code style={{
                              fontSize: '.72rem', letterSpacing: '.04em',
                              background: '#F0F2F5', color: '#4A5568',
                              padding: '3px 8px', borderRadius: 4,
                              fontFamily: 'monospace', whiteSpace: 'nowrap',
                              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                              maxWidth: 200,
                            }}
                              title={imp.codeExercice + ' ' + imp.codeSection}
                            >
                              {imp.codeExercice} {imp.codeSection} {imp.programme.code} {imp.action.code} {imp.typeService.code} {imp.localisation.code} {imp.numeroOrdre}…
                            </code>
                          </td>

                          {/* Statut */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 12px', borderRadius: 999, border: `1px solid ${cfg.border}`,
                              background: cfg.bg, color: cfg.color, fontSize: '.75rem', fontWeight: 600,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 16px', fontSize: '.78rem', color: '#8E9BAA', whiteSpace: 'nowrap' }}>
                            {new Date(imp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 5 }}>

                              {/* Voir */}
                              <Link href={APP_ROUTES.ORD_IMPUTATION_DETAIL(imp.id)} style={{ textDecoration: 'none' }}>
                                <button title="Voir le détail" style={btnStyle('#E8ECF0', '#0D2B55', '#F0F2F5')}>
                                  <IconEye />
                                </button>
                              </Link>

                              {/* Modifier */}
                              {canEdit && (
                                <Link href={APP_ROUTES.ORD_IMPUTATION_MODIFIER(imp.id)} style={{ textDecoration: 'none' }}>
                                  <button title="Modifier" disabled={isPending} style={btnStyle('#007A3D20', '#007A3D', '#F0FDF4')}>
                                    <IconEdit />
                                  </button>
                                </Link>
                              )}

                              {/* Soumettre */}
                              {canSubmit && (
                                <button
                                  title="Soumettre au CF"
                                  disabled={isPending}
                                  onClick={() => handleSoumettre(imp)}
                                  style={btnStyle('#0D2B5520', '#0D2B55', 'rgba(13,43,85,.06)')}
                                >
                                  {isPending ? <Spinner size={11} color="#0D2B55" /> : <IconSend />}
                                </button>
                              )}

                              {/* Supprimer */}
                              {canDelete && (
                                <button
                                  title="Supprimer"
                                  disabled={isPending}
                                  onClick={() => setConfirmDelete(imp)}
                                  style={btnStyle('#CE112620', '#CE1126', '#FEF2F2')}
                                >
                                  <IconTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Légende statuts ── */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
            {(Object.entries(STATUT_CONFIG) as [StatutImputation, typeof STATUT_CONFIG[StatutImputation]][]).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', color: '#8E9BAA' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                {key === 'EN_ATTENTE' && <span>— En cours d'examen par le CF</span>}
                {key === 'REJETEE'    && <span>— Modifiable et re-soumissible</span>}
                {key === 'VALIDEE'    && <span>— Transmise au Comptable</span>}
                {key === 'BROUILLON'  && <span>— Non soumise</span>}
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'cardReveal .2s ease' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 12 }}>
              Supprimer l'imputation ?
            </h3>
            <div style={{ padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, marginBottom: 14 }}>
              <p style={{ fontSize: '.82rem', fontWeight: 600, color: '#0D2B55' }}>{confirmDelete.libelle}</p>
              <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 3 }}>
                {confirmDelete.programme.libelle} · Action {confirmDelete.action.code}
              </p>
            </div>
            <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: 20 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#CE1126', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#0D2B55' : '#CE1126',
          color: '#fff', fontSize: '.85rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          animation: 'fadeSlideDown .3s ease',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// Petit helper pour les boutons d'action du tableau
function btnStyle(border: string, color: string, bg: string): React.CSSProperties {
  return {
    width: 30, height: 30, border: `1px solid ${border}`,
    borderRadius: 6, background: bg, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color,
  };
}