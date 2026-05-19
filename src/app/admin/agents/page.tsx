'use client';

// ============================================================
// FICHIER  : src/app/admin/agents/page.tsx
// ROUTE    : /admin/agents
// RÔLE     : Liste des agents avec actions (activate/deactivate, voir détail).
//
// FONCTIONNALITÉS :
//   - KPIs : total, actifs, inactifs, sans compte
//   - Liste avec recherche (nom, matricule, CNI, NUI, téléphone, email)
//   - Badge "Sans compte" pour les agents non encore liés à un user
//   - Lien vers le compte utilisateur si l'agent a un userId
//   - Clic sur ligne → /admin/agents/[agentId]
//   - Bouton + Nouvel agent → /admin/agents/create
//
// API :
//   GET   /api/v1/admin/agents
//   PATCH /api/v1/admin/agents/{id}/reactivate
//   PATCH /api/v1/admin/agents/{id}/deactivate
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, getUserContext } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS } from '@/constants/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

// ── Types ────────────────────────────────────────────────────
interface Agent {
  id:            string;
  firstName:     string;
  lastName:      string;
  dateOfBirth:   string;
  matricule:     string;
  nui:           string;
  numeroCni:     string;
  cniIssueDate:  string;
  cniExpiryDate: string;
  phoneNumber:   string;
  actif:         boolean;
  // Champs présents uniquement si l'agent a un compte utilisateur lié
  userId?:       string | null;
  email?:        string | null;
}

// ── Icônes ──────────────────────────────────────────────────
const IconBadge      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;
const IconPlus       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconRefresh    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,11 16,11"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 11"/></svg>;
const IconCheck      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>;
const IconX          = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconWarn       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconLink       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconEmpty      = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;

const Spinner = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(0,0,0,.1)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminAgentsPage() {
  const router = useRouter();

  const [adminName,  setAdminName]  = useState('');
  const [agents,     setAgents]     = useState<Agent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [search,     setSearch]     = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setPending = (id: string, v: boolean) => {
    setPendingIds(prev => { const n = new Set(prev); v ? n.add(id) : n.delete(id); return n; });
  };

  // ── Guard admin ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (!ctx) { router.replace(APP_ROUTES.LOGIN); return; }
    if (ctx.role !== 'ADMIN') { router.replace(APP_ROUTES.DASHBOARD); return; }
    setAdminName(`${ctx.firstName} ${ctx.lastName}`);
  }, [router]);

  // ── Chargement des agents ──
  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.AGENTS, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Impossible de charger les agents.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  // ── Activer ──
  const handleActivate = async (agent: Agent) => {
    if (pendingIds.has(agent.id)) return;
    setPending(agent.id, true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.AGENT_ACTIVATE(agent.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, actif: true } : a));
      showToast(`Agent ${agent.firstName} ${agent.lastName} réactivé.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la réactivation.', 'error');
    } finally {
      setPending(agent.id, false);
    }
  };

  // ── Désactiver ──
  const handleDeactivate = async (agent: Agent) => {
    if (pendingIds.has(agent.id)) return;
    setPending(agent.id, true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.AGENT_DEACTIVATE(agent.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, actif: false } : a));
      showToast(`Agent ${agent.firstName} ${agent.lastName} désactivé.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la désactivation.', 'error');
    } finally {
      setPending(agent.id, false);
    }
  };

  // ── Filtrage ──
  const filtered = agents.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.firstName    ?? '').toLowerCase().includes(q) ||
      (a.lastName     ?? '').toLowerCase().includes(q) ||
      (a.matricule    ?? '').toLowerCase().includes(q) ||
      (a.numeroCni    ?? '').toLowerCase().includes(q) ||
      (a.nui          ?? '').toLowerCase().includes(q) ||
      (a.phoneNumber  ?? '').toLowerCase().includes(q) ||
      (a.email        ?? '').toLowerCase().includes(q)
    );
  });

  // ── KPIs ──
  const totalAgents    = agents.length;
  const activeAgents   = agents.filter(a => a.actif).length;
  const inactiveAgents = agents.filter(a => !a.actif).length;
  const withoutAccount = agents.filter(a => !a.userId).length;

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      <AdminSidebar active="agents" adminName={adminName} agentsCount={totalAgents} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Gestion des agents</h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>{totalAgents} agent(s) enregistré(s) dans le système</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadAgents} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
              <IconRefresh /> Rafraîchir
            </button>
            <Link href={APP_ROUTES.ADMIN_CREATE_AGENT} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(13,43,85,.25)' }}>
                <IconPlus /> Nouvel agent
              </button>
            </Link>
          </div>
        </header>

        {/* Bande tricolore */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="6" height="6" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div style={{ background: '#FCD116' }} />
        </div>

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total agents',     value: totalAgents,    color: '#0D2B55', icon: <IconBadge /> },
              { label: 'Agents actifs',    value: activeAgents,   color: '#007A3D', icon: <IconCheck /> },
              { label: 'Agents inactifs',  value: inactiveAgents, color: '#CE1126', icon: <IconX /> },
              { label: 'Sans compte',      value: withoutAccount, color: '#D97706', icon: <IconWarn /> },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', border: '1px solid #E8ECF0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: '.75rem', color: '#8E9BAA' }}>{k.label}</p>
                  <span style={{ color: k.color, opacity: .7 }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Liste des agents</h2>
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>Personnel administratif enregistré</p>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher (nom, matricule, CNI, NUI…)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '9px 14px 9px 36px', border: '1.5px solid #E8ECF0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.82rem', width: 320, outline: 'none' }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <Spinner size={36} color="#0D2B55" />
                <p style={{ fontSize: '.875rem' }}>Chargement des agents…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <div style={{ color: '#D1D8E0' }}><IconEmpty /></div>
                <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#4A5568' }}>
                  {search ? 'Aucun résultat pour cette recherche' : 'Aucun agent enregistré'}
                </p>
                {!search && (
                  <Link href={APP_ROUTES.ADMIN_CREATE_AGENT} style={{ textDecoration: 'none' }}>
                    <button style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 8, background: '#0D2B55', color: '#fff', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>
                      <IconPlus /> Créer le premier agent
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FB' }}>
                      {['Agent', 'Matricule', 'CNI / NUI', 'Téléphone', 'Compte', 'Statut', 'Actions'].map(col => (
                        <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid #E8ECF0', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((agent, idx) => {
                      const isPending = pendingIds.has(agent.id);
                      const initials  = `${(agent.firstName ?? '?')[0]}${(agent.lastName ?? '')[0] ?? ''}`;
                      const hasAccount = !!agent.userId;

                      return (
                        <tr
                          key={agent.id}
                          style={{
                            borderBottom: idx < filtered.length - 1 ? '1px solid #F0F2F5' : 'none',
                            opacity: isPending ? 0.6 : 1,
                            cursor: isPending ? 'default' : 'pointer',
                            transition: 'background .15s',
                          }}
                          onClick={() => { if (!isPending) router.push(APP_ROUTES.ADMIN_AGENT_DETAIL(agent.id)); }}
                          onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#F8F9FB'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Agent */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                                {initials}
                              </div>
                              <div>
                                <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55' }}>{agent.firstName} {agent.lastName}</p>
                                {agent.email && (
                                  <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 1 }}>{agent.email}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Matricule */}
                          <td style={{ padding: '14px 16px', fontSize: '.82rem', color: '#4A5568', fontFamily: 'monospace' }}>
                            {agent.matricule}
                          </td>

                          {/* CNI / NUI */}
                          <td style={{ padding: '14px 16px', fontSize: '.78rem' }}>
                            <p style={{ color: '#4A5568', fontFamily: 'monospace' }}>{agent.numeroCni}</p>
                            <p style={{ color: '#8E9BAA', fontSize: '.7rem', fontFamily: 'monospace', marginTop: 1 }}>NUI : {agent.nui}</p>
                          </td>

                          {/* Téléphone */}
                          <td style={{ padding: '14px 16px', fontSize: '.82rem', color: '#4A5568', fontFamily: 'monospace' }}>
                            {agent.phoneNumber}
                          </td>

                          {/* Compte lié */}
                          <td style={{ padding: '14px 16px' }}>
                            {hasAccount ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                <IconLink /> Lié
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600, background: '#FFF7ED', color: '#92400E', border: '1px solid #FCD34D' }}>
                                <IconWarn /> Sans compte
                              </span>
                            )}
                          </td>

                          {/* Statut */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, background: agent.actif ? '#F0FDF4' : '#FEF2F2', color: agent.actif ? '#166534' : '#991B1B', border: `1px solid ${agent.actif ? '#BBF7D0' : '#FECACA'}` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.actif ? '#22C55E' : '#EF4444' }} />
                              {agent.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Link href={APP_ROUTES.ADMIN_AGENT_DETAIL(agent.id)} style={{ textDecoration: 'none' }}>
                                <button title="Voir le détail" disabled={isPending} style={btnStyle('#0D2B5520', '#0D2B55', '#EFF6FF')}>
                                  <IconEye />
                                </button>
                              </Link>

                              {agent.actif ? (
                                <button title="Désactiver" disabled={isPending} onClick={() => handleDeactivate(agent)} style={btnStyle('#CE112620', '#CE1126', '#FEF2F2')}>
                                  {isPending ? <Spinner size={11} color="#CE1126" /> : <IconX />}
                                </button>
                              ) : (
                                <button title="Réactiver" disabled={isPending} onClick={() => handleActivate(agent)} style={btnStyle('#007A3D20', '#007A3D', '#F0FDF4')}>
                                  {isPending ? <Spinner size={11} color="#007A3D" /> : <IconCheck />}
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
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#0D2B55' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s ease' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

function btnStyle(border: string, color: string, bg: string): React.CSSProperties {
  return { width: 30, height: 30, border: `1px solid ${border}`, borderRadius: 6, background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color };
}