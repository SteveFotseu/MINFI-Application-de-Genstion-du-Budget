'use client';

// ============================================================
// FICHIER  : src/app/controleur-financier/imputations/page.tsx
// RÔLE     : File d'attente du Contrôleur Financier.
//            Affiche les imputations EN_ATTENTE filtrées par
//            la section ET le programme du CF connecté.
//
// ACTIONS :
//   - Valider  → statut VALIDEE (transmise au Comptable)
//   - Rejeter  → statut REJETEE + saisie du motif obligatoire
//   - Voir le détail complet de l'imputation (code + libellés)
//
// ⚠️  DONNÉES : localStorage en attendant le back-end.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';
import type { ImputationBudgetaire } from '@/types/imputation';

// ─────────────────────────────────────────────────────────────
// ICÔNES
// ─────────────────────────────────────────────────────────────
const IconCheck  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>);
const IconX      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconAlert  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconEmpty  = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M9 8h6M9 11h4"/></svg>);
const IconRefresh = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,11 16,11"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 11"/></svg>);

const Spinner = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(255,255,255,.25)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
export default function CFImputationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<{
    firstName: string; lastName: string;
    section: string; programme: string;
  } | null>(null);

  const [imputations,  setImputations]  = useState<ImputationBudgetaire[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [pendingIds,   setPendingIds]   = useState<Set<string>>(new Set());
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal valider
  const [confirmValider, setConfirmValider] = useState<ImputationBudgetaire | null>(null);

  // Modal rejeter
  const [confirmRejeter, setConfirmRejeter] = useState<ImputationBudgetaire | null>(null);
  const [motifRejet,     setMotifRejet]     = useState('');
  const [motifError,     setMotifError]     = useState('');

  // Détail expandé (affiche le code complet inline)
  const [expanded, setExpanded] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const setPending = (id: string, p: boolean) => {
    setPendingIds(prev => { const next = new Set(prev); p ? next.add(id) : next.delete(id); return next; });
  };

  // ── Guard CF ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }

    const ctx = getUserContext();
    if (!ctx) { router.replace(APP_ROUTES.LOGIN); return; }

    const aff  = ctx.affectations?.find(a => a.actif) ?? ctx.affectations?.[0];
    const role = aff?.roleSysteme ?? '';
    if (role !== 'CONTROLEUR_FINANCIER') {
      router.replace(APP_ROUTES.DASHBOARD); return;
    }
    setUser({
      firstName: ctx.firstName, lastName: ctx.lastName,
      section:   aff?.sectionLibelle ?? '',
      programme: aff?.programmeLibelle ?? '',
    });
  }, [router]);

  // ── Chargement : imputations EN_ATTENTE ──
  const loadImputations = useCallback(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      // Filtre : seulement EN_ATTENTE (le CF voit celles de sa section/programme)
      const queue = all
        .filter(i => i.statut === 'EN_ATTENTE')
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); // Plus ancienne en premier
      setImputations(queue);
    } catch {
      setImputations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImputations(); }, [loadImputations]);

  // ── Valider ──
  const handleValider = async (imp: ImputationBudgetaire) => {
    if (pendingIds.has(imp.id)) return;
    setPending(imp.id, true);
    try {
      await new Promise(r => setTimeout(r, 700));
      const raw  = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      const idx  = all.findIndex(i => i.id === imp.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          statut:          'VALIDEE',
          dateDecisionCF:  new Date().toISOString(),
          updatedAt:       new Date().toISOString(),
        };
        localStorage.setItem('gbe_imputations', JSON.stringify(all));
      }
      setImputations(prev => prev.filter(i => i.id !== imp.id));
      setConfirmValider(null);
      showToast(`"${imp.libelle}" validée et transmise au Comptable.`);
    } finally {
      setPending(imp.id, false);
    }
  };

  // ── Rejeter ──
  const handleRejeter = async () => {
    if (!confirmRejeter) return;
    if (!motifRejet.trim()) { setMotifError('Le motif est obligatoire.'); return; }
    if (motifRejet.trim().length < 10) { setMotifError('Le motif doit contenir au moins 10 caractères.'); return; }

    const imp = confirmRejeter;
    setPending(imp.id, true);
    try {
      await new Promise(r => setTimeout(r, 700));
      const raw  = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      const idx  = all.findIndex(i => i.id === imp.id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          statut:         'REJETEE',
          motifRejet:     motifRejet.trim(),
          dateDecisionCF: new Date().toISOString(),
          updatedAt:      new Date().toISOString(),
        };
        localStorage.setItem('gbe_imputations', JSON.stringify(all));
      }
      setImputations(prev => prev.filter(i => i.id !== imp.id));
      setConfirmRejeter(null);
      setMotifRejet('');
      setMotifError('');
      showToast(`"${imp.libelle}" rejetée. L'ordonnateur a été notifié.`);
    } finally {
      setPending(imp.id, false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{ width: 240, flexShrink: 0, background: 'linear-gradient(180deg, #005A2D 0%, #003D1E 100%)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 50 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>Contrôleur Financier</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>
          {[
            { label: 'Tableau de bord', href: APP_ROUTES.CF_DASHBOARD },
            { label: 'File d\'attente',  href: APP_ROUTES.CF_IMPUTATIONS, active: true },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: item.active ? 'rgba(255,255,255,.12)' : 'transparent', border: item.active ? '1px solid rgba(255,255,255,.15)' : '1px solid transparent' }}>
                <span style={{ fontSize: '.85rem', fontWeight: item.active ? 600 : 400, color: item.active ? '#fff' : 'rgba(255,255,255,.55)' }}>{item.label}</span>
                {item.active && imputations.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '.65rem', background: '#CE1126', color: '#fff', borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
                    {imputations.length}
                  </span>
                )}
              </div>
            </Link>
          ))}

          {user && (
            <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }}>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Section</p>
              <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.8)', marginBottom: 8, lineHeight: 1.3 }}>{user.section}</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Programme</p>
              <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.3 }}>{user.programme}</p>
            </div>
          )}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>
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

      {/* ════ CONTENU ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
              Imputations à examiner
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              {user?.section ?? '…'} · {imputations.length} dossier(s) en attente
            </p>
          </div>
          <button onClick={loadImputations} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
            <IconRefresh /> Rafraîchir
          </button>
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

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'En attente de visa', value: imputations.length, color: '#CE1126', note: 'À examiner maintenant' },
              { label: 'Validées ce mois', value: '—', color: '#007A3D', note: 'Transmises au Comptable' },
              { label: 'Rejetées ce mois',  value: '—', color: '#D97706', note: 'Retournées à l\'ordonnateur' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #E8ECF0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 4 }}>{k.note}</p>
              </div>
            ))}
          </div>

          {/* Tableau file d'attente */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>File d'attente</h2>
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>Imputations soumises par les ordonnateurs</p>
              </div>
              {imputations.length > 0 && (
                <span style={{ padding: '4px 14px', borderRadius: 999, background: '#FEF2F2', color: '#CE1126', fontSize: '.78rem', fontWeight: 700, border: '1px solid #FECACA' }}>
                  {imputations.length} dossier(s)
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <Spinner size={36} color="#007A3D" />
                <p style={{ fontSize: '.875rem' }}>Chargement…</p>
              </div>
            ) : imputations.length === 0 ? (
              <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <div style={{ color: '#D1D8E0' }}><IconEmpty /></div>
                <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#4A5568' }}>File d'attente vide</p>
                <p style={{ fontSize: '.8rem' }}>Aucune imputation en attente de visa pour le moment.</p>
              </div>
            ) : (
              <div>
                {imputations.map((imp, idx) => {
                  const isPending  = pendingIds.has(imp.id);
                  const isExpanded = expanded === imp.id;
                  // Durée d'attente
                  const waitMs = Date.now() - new Date(imp.updatedAt).getTime();
                  const waitH  = Math.floor(waitMs / 3600000);
                  const waitD  = Math.floor(waitH / 24);
                  const waitLabel = waitD > 0 ? `${waitD} jour(s)` : `${waitH}h`;
                  const isUrgent  = waitH >= 48;

                  return (
                    <div key={imp.id} style={{ borderBottom: idx < imputations.length - 1 ? '1px solid #F0F2F5' : 'none', opacity: isPending ? 0.6 : 1, transition: 'opacity .2s' }}>

                      {/* Ligne principale */}
                      <div
                        style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8F9FB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setExpanded(isExpanded ? null : imp.id)}
                      >
                        {/* Indicateur urgence */}
                        <div style={{ width: 6, flexShrink: 0, height: 48, borderRadius: 3, background: isUrgent ? '#CE1126' : '#E8ECF0' }} />

                        {/* Infos principales */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <p style={{ fontSize: '.875rem', fontWeight: 700, color: '#0D2B55', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {imp.libelle}
                            </p>
                            {isUrgent && (
                              <span style={{ padding: '2px 8px', borderRadius: 999, background: '#FEF2F2', color: '#CE1126', fontSize: '.68rem', fontWeight: 700, flexShrink: 0 }}>URGENT</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '.75rem', color: '#8E9BAA' }}>
                              <strong style={{ color: '#4A5568' }}>Programme :</strong> {imp.programme.libelle} ({imp.programme.code})
                            </span>
                            <span style={{ fontSize: '.75rem', color: '#8E9BAA' }}>
                              <strong style={{ color: '#4A5568' }}>Action :</strong> {imp.action.code} · {imp.action.libelle}
                            </span>
                            <span style={{ fontSize: '.75rem', color: '#8E9BAA' }}>
                              <strong style={{ color: '#4A5568' }}>Titre éco. :</strong> {imp.titre.libelle} ({imp.titre.code})
                            </span>
                          </div>
                        </div>

                        {/* Délai d'attente */}
                        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                          <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>En attente depuis</p>
                          <p style={{ fontSize: '.875rem', fontWeight: 700, color: isUrgent ? '#CE1126' : '#4A5568' }}>{waitLabel}</p>
                        </div>

                        {/* Boutons d'action */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button
                            disabled={isPending}
                            onClick={() => setConfirmValider(imp)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #007A3D, #005A2D)', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600, color: '#fff', boxShadow: '0 3px 10px rgba(0,122,61,.25)' }}
                          >
                            {isPending ? <Spinner size={13} /> : <IconCheck />} Valider
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => { setConfirmRejeter(imp); setMotifRejet(''); setMotifError(''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid #FECACA', borderRadius: 8, background: '#FEF2F2', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600, color: '#CE1126' }}
                          >
                            <IconX /> Rejeter
                          </button>
                        </div>

                        {/* Chevron expand */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                          <polyline points="6,9 12,15 18,9"/>
                        </svg>
                      </div>

                      {/* Détail expandé */}
                      {isExpanded && (
                        <div style={{ padding: '0 24px 20px 46px', animation: 'fadeSlideDown .2s ease' }}>
                          <div style={{ background: '#0D2B55', borderRadius: 10, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginRight: 8, flexShrink: 0 }}>Code complet :</p>
                            {[
                              { v: imp.codeExercice,     c: '#8E9BAA' },
                              { v: imp.codeSection,      c: '#8E9BAA' },
                              { v: imp.programme.code,   c: '#378ADD' },
                              { v: imp.action.code,      c: '#378ADD' },
                              { v: imp.typeService.code, c: '#7C3AED' },
                              { v: imp.localisation.code,c: '#7C3AED' },
                              { v: imp.numeroOrdre,      c: '#7C3AED' },
                              { v: imp.division.code,    c: '#1D9E75' },
                              { v: imp.groupe.code,      c: '#1D9E75' },
                              { v: imp.classe.code,      c: '#1D9E75' },
                              { v: imp.titre.code,       c: '#EF9F27' },
                              { v: imp.article.code,     c: '#EF9F27' },
                              { v: imp.paragraphe.code,  c: '#EF9F27' },
                              { v: imp.rubrique.code,    c: '#EF9F27' },
                            ].map((s, i, arr) => (
                              <React.Fragment key={i}>
                                <code style={{ padding: '3px 8px', borderRadius: 5, background: `${s.c}20`, border: `1px solid ${s.c}40`, fontFamily: 'monospace', fontSize: '.78rem', fontWeight: 700, color: s.c, letterSpacing: '.08em' }}>
                                  {s.v}
                                </code>
                                {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,.2)', fontSize: '.7rem' }}>·</span>}
                              </React.Fragment>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                            {[
                              { label: 'Type de service',  value: `${imp.typeService.libelle} (${imp.typeService.code})` },
                              { label: 'Localisation',      value: `${imp.localisation.libelle} (${imp.localisation.code})` },
                              { label: 'Classification fct', value: `${imp.division.libelle} › ${imp.groupe.libelle} › ${imp.classe.libelle}` },
                              { label: 'Nature économique', value: `${imp.titre.libelle} › ${imp.article.libelle}` },
                              { label: 'Rubrique',          value: `${imp.rubrique.libelle} (${imp.rubrique.code})` },
                              { label: 'Soumise le',        value: new Date(imp.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                            ].map(f => (
                              <div key={f.label} style={{ padding: '10px 12px', background: '#F8F9FB', borderRadius: 8, border: '1px solid #E8ECF0' }}>
                                <p style={{ fontSize: '.68rem', color: '#8E9BAA', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{f.label}</p>
                                <p style={{ fontSize: '.78rem', color: '#1A202C', lineHeight: 1.4 }}>{f.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modal : Confirmer validation ── */}
      {confirmValider && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setConfirmValider(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'cardReveal .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,122,61,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007A3D' }}><IconCheck /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Valider cette imputation ?</h3>
            </div>
            <div style={{ padding: '12px 14px', background: '#F8F9FB', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#0D2B55' }}>{confirmValider.libelle}</p>
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 4 }}>{confirmValider.programme.libelle} · Action {confirmValider.action.code}</p>
            </div>
            <p style={{ fontSize: '.82rem', color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 18 }}>
              ✓ L'imputation sera transmise au Comptable pour exécution.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmValider(null)} style={{ padding: '10px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>Annuler</button>
              <button
                onClick={() => handleValider(confirmValider)}
                disabled={pendingIds.has(confirmValider.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #007A3D, #005A2D)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(0,122,61,.25)' }}
              >
                {pendingIds.has(confirmValider.id) ? <Spinner size={14} /> : <IconCheck />} Confirmer la validation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Saisir motif de rejet ── */}
      {confirmRejeter && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setConfirmRejeter(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 460, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'cardReveal .2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(206,17,38,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CE1126' }}><IconX /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Rejeter cette imputation</h3>
            </div>
            <div style={{ padding: '12px 14px', background: '#F8F9FB', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#0D2B55' }}>{confirmRejeter.libelle}</p>
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 4 }}>{confirmRejeter.programme.libelle} · Action {confirmRejeter.action.code}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#4A5568', marginBottom: 8 }}>
                Motif du rejet * <span style={{ fontWeight: 400, color: '#8E9BAA' }}>(obligatoire — visible par l'ordonnateur)</span>
              </label>
              <textarea
                value={motifRejet}
                onChange={e => { setMotifRejet(e.target.value); setMotifError(''); }}
                placeholder="Ex : Imputation incorrecte — le type de service 33 ne correspond pas à ce programme. Veuillez sélectionner le type 44 (Délégation régionale)."
                rows={4}
                style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${motifError ? '#CE1126' : '#E8ECF0'}`, borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#1A202C', resize: 'vertical', outline: 'none', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = '#0D2B55'}
                onBlur={e  => e.target.style.borderColor = motifError ? '#CE1126' : '#E8ECF0'}
              />
              {motifError && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#CE1126', marginTop: 5 }}>
                  <IconAlert /> {motifError}
                </p>
              )}
              <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 4 }}>
                {motifRejet.length} caractères (minimum 10)
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmRejeter(null)} style={{ padding: '10px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>Annuler</button>
              <button
                onClick={handleRejeter}
                disabled={pendingIds.has(confirmRejeter.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #CE1126, #8B0914)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(206,17,38,.25)' }}
              >
                {pendingIds.has(confirmRejeter.id) ? <Spinner size={14} /> : <IconX />} Rejeter l'imputation
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#005A2D' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s ease' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}