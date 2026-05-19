'use client';

// ============================================================
// FICHIER  : src/app/admin/agents/[agentId]/page.tsx
// ROUTE    : /admin/agents/{agentId}
// RÔLE     : Affiche le détail complet d'un agent.
//
// FONCTIONNALITÉS :
//   - Identité, documents officiels, contact
//   - Statut (actif/inactif)
//   - Lien vers le compte utilisateur lié (si présent)
//   - Actions : activer/désactiver, retour
//   - Note : la MODIFICATION n'est pas encore supportée par le backend
//     (route PUT/PATCH /admin/agents/{id} pas encore implémentée).
//     Le bouton "Modifier" est désactivé avec un tooltip explicatif.
//
// API :
//   GET   /api/v1/admin/agents/{agentId}
//   PATCH /api/v1/admin/agents/{agentId}/reactivate
//   PATCH /api/v1/admin/agents/{agentId}/deactivate
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, getUserContext } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS } from '@/constants/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

// ── Types ────────────────────────────────────────────────────
interface AgentDetail {
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
  userId?:       string | null;
  email?:        string | null;
}

// ── Icônes ──────────────────────────────────────────────────
const IconArrow    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>;
const IconX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconMail     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>;
const IconID       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;
const IconCal      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconLink     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconWarn     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const Spinner = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(0,0,0,.1)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

// ── Helper : ligne info ──────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0F2F5' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D2B55', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '.68rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
        <div style={{ fontSize: '.875rem', color: '#0D2B55', fontWeight: 500, wordBreak: 'break-word' }}>
          {value || <span style={{ color: '#B0BBC8', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
        </div>
      </div>
    </div>
  );
}

// ── Helper : format date ─────────────────────────────────────
function formatDate(d?: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
}

// ── Helper : CNI expirée ? ───────────────────────────────────
function isCniExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  try { return new Date(expiryDate) < new Date(); }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminAgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.agentId as string;

  const [adminName,     setAdminName]     = useState('');
  const [agent,         setAgent]         = useState<AgentDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<'activate' | 'deactivate' | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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

  // ── Chargement ──
  const loadAgent = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.AGENT_BY_ID(agentId), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Agent introuvable');
        throw new Error(`Erreur ${res.status}`);
      }
      const data: AgentDetail = await res.json();
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { loadAgent(); }, [loadAgent]);

  // ── Activer / Désactiver ──
  const handleToggleActive = async () => {
    if (!agent || actionPending) return;
    const isActivating = !agent.actif;
    setActionPending(isActivating ? 'activate' : 'deactivate');
    try {
      const token = getAccessToken();
      const url = isActivating
        ? ADMIN_ENDPOINTS.AGENT_ACTIVATE(agent.id)
        : ADMIN_ENDPOINTS.AGENT_DEACTIVATE(agent.id);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setAgent({ ...agent, actif: isActivating });
      showToast(`Agent ${isActivating ? 'réactivé' : 'désactivé'} avec succès.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'opération.', 'error');
    } finally {
      setActionPending(null);
    }
  };

  const initials = agent
    ? `${(agent.firstName ?? '?')[0]}${(agent.lastName ?? '')[0] ?? ''}`
    : '?';

  const cniExpired = agent ? isCniExpired(agent.cniExpiryDate) : false;

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      <AdminSidebar active="agents" adminName={adminName} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href={APP_ROUTES.ADMIN_AGENTS} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
                <IconArrow /> Retour
              </button>
            </Link>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Détail de l&apos;agent</h1>
              <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>Informations administratives complètes</p>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="6" height="6" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></div>
          <div style={{ background: '#FCD116' }} />
        </div>

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
              <Spinner size={40} color="#0D2B55" />
              <p style={{ fontSize: '.875rem' }}>Chargement de l&apos;agent…</p>
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <div style={{ maxWidth: 600, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 14, border: '1px solid #FECACA', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#CE1126' }}>
                <IconWarn />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 8 }}>{error}</h2>
              <p style={{ fontSize: '.875rem', color: '#8E9BAA', marginBottom: 20 }}>Vérifiez l&apos;identifiant ou retournez à la liste.</p>
              <Link href={APP_ROUTES.ADMIN_AGENTS} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#0D2B55', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff' }}>
                  Retour à la liste
                </button>
              </Link>
            </div>
          )}

          {/* Détail */}
          {!loading && !error && agent && (
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>

              {/* ═══ COLONNE GAUCHE : Profil + Actions ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Carte profil */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <div style={{ height: 80, background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A227, #E0B533)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D2B55', fontWeight: 700, fontSize: '1.6rem', border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>
                      {initials}
                    </div>
                  </div>

                  <div style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#0D2B55' }}>{agent.firstName} {agent.lastName}</h2>
                    <p style={{ fontSize: '.82rem', color: '#8E9BAA', marginTop: 4, fontFamily: 'monospace' }}>Matricule : {agent.matricule}</p>

                    {/* Statuts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8F9FB', borderRadius: 8 }}>
                        <span style={{ fontSize: '.78rem', color: '#4A5568' }}>Statut</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 600, background: agent.actif ? '#F0FDF4' : '#FEF2F2', color: agent.actif ? '#166534' : '#991B1B', border: `1px solid ${agent.actif ? '#BBF7D0' : '#FECACA'}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.actif ? '#22C55E' : '#EF4444' }} />
                          {agent.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8F9FB', borderRadius: 8 }}>
                        <span style={{ fontSize: '.78rem', color: '#4A5568' }}>Compte utilisateur</span>
                        {agent.userId ? (
                          <Link href={APP_ROUTES.ADMIN_USER_DETAIL(agent.userId)} style={{ textDecoration: 'none' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', cursor: 'pointer' }}>
                              <IconLink /> Voir le compte
                            </span>
                          </Link>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 600, background: '#FFF7ED', color: '#92400E', border: '1px solid #FCD34D' }}>
                            <IconWarn /> Sans compte
                          </span>
                        )}
                      </div>

                      {cniExpired && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                          <span style={{ fontSize: '.78rem', color: '#991B1B', fontWeight: 500 }}>⚠ CNI expirée</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55', marginBottom: 14 }}>Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Modifier — désactivé tant que le backend ne supporte pas */}
                    <button
                      type="button"
                      disabled
                      title="La modification d'un agent n'est pas encore disponible (backend en cours de développement)."
                      style={{
                        ...actionBtnStyle('#8E9BAA', '#F8F9FB', '#E8ECF0'),
                        cursor: 'not-allowed',
                        opacity: 0.7,
                      }}
                    >
                      <IconEdit /> Modifier (bientôt disponible)
                    </button>

                    <button
                      onClick={handleToggleActive}
                      disabled={actionPending !== null}
                      style={actionBtnStyle(agent.actif ? '#CE1126' : '#007A3D', agent.actif ? '#FEF2F2' : '#F0FDF4', agent.actif ? '#FECACA' : '#BBF7D0')}
                    >
                      {actionPending
                        ? <Spinner size={13} color={agent.actif ? '#CE1126' : '#007A3D'} />
                        : (agent.actif ? <IconX /> : <IconCheck />)}
                      {agent.actif ? 'Désactiver l\'agent' : 'Réactiver l\'agent'}
                    </button>

                    {!agent.userId && (
                      <Link href={APP_ROUTES.ADMIN_CREATE_USER} style={{ textDecoration: 'none' }}>
                        <button style={actionBtnStyle('#1D4ED8', '#EFF6FF', '#BFDBFE')}>
                          <IconLink /> Créer un compte utilisateur
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ COLONNE DROITE : Identité + Documents ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Carte identité */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 4, height: 18, background: '#C9A227', borderRadius: 2 }} />
                    Identité de l&apos;agent
                  </h3>
                  <div>
                    <InfoRow icon={<IconID />}    label="Prénom"           value={agent.firstName} />
                    <InfoRow icon={<IconID />}    label="Nom"              value={agent.lastName} />
                    <InfoRow icon={<IconCal />}   label="Date de naissance" value={formatDate(agent.dateOfBirth)} />
                    <InfoRow icon={<IconPhone />} label="Téléphone"        value={<span style={{ fontFamily: 'monospace' }}>{agent.phoneNumber}</span>} />
                    {agent.email && (
                      <InfoRow icon={<IconMail />} label="Email (compte lié)" value={agent.email} />
                    )}
                  </div>
                </div>

                {/* Carte documents officiels */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 4, height: 18, background: '#C9A227', borderRadius: 2 }} />
                    Documents officiels
                  </h3>
                  <div>
                    <InfoRow icon={<IconID />}  label="Matricule" value={<code style={{ fontSize: '.85rem', background: '#F8F9FB', padding: '2px 8px', borderRadius: 4 }}>{agent.matricule}</code>} />
                    <InfoRow icon={<IconID />}  label="NUI"       value={<code style={{ fontSize: '.85rem', background: '#F8F9FB', padding: '2px 8px', borderRadius: 4 }}>{agent.nui}</code>} />
                    <InfoRow icon={<IconID />}  label="Numéro de CNI" value={<code style={{ fontSize: '.85rem', background: '#F8F9FB', padding: '2px 8px', borderRadius: 4 }}>{agent.numeroCni}</code>} />
                    <InfoRow icon={<IconCal />} label="Date d&apos;émission CNI"   value={formatDate(agent.cniIssueDate)} />
                    <InfoRow
                      icon={<IconCal />}
                      label="Date d&apos;expiration CNI"
                      value={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {formatDate(agent.cniExpiryDate)}
                          {cniExpired && (
                            <span style={{ fontSize: '.66rem', padding: '1px 7px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 4, fontWeight: 600 }}>
                              EXPIRÉE
                            </span>
                          )}
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* ID technique (pour debug/référence) */}
                <div style={{ background: '#F8F9FB', borderRadius: 10, padding: 14, border: '1px dashed #D1D8E0', fontSize: '.72rem', color: '#8E9BAA' }}>
                  ID technique : <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 3 }}>{agent.id}</code>
                </div>
              </div>
            </div>
          )}
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

function actionBtnStyle(color: string, bg: string, border: string): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: `1.5px solid ${border}`,
    borderRadius: 8,
    background: bg,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '.82rem',
    fontWeight: 600,
    color,
    transition: 'all .15s',
  };
}