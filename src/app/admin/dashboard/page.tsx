'use client';

// ============================================================
// FICHIER  : src/app/admin/dashboard/page.tsx
// RÔLE     : Dashboard principal de l'administrateur GBE.
//
// FONCTIONNALITÉS :
//   - Vue d'ensemble des utilisateurs (total, actifs, inactifs)
//   - Liste des utilisateurs avec rôle, section, programmes
//   - Actions : voir détail, modifier, activer/désactiver, supprimer
//   - Clic sur une ligne → /admin/users/[userId] (page détail)
//
// v3 : utilise désormais <AdminSidebar /> partagé.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, getUserContext } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS } from '@/constants/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

// ── Types ────────────────────────────────────────────────────
interface Mandat {
  mandatId:         string;
  roleSysteme:      string;
  sectionId:        string;
  sectionLibelle:   string;
  programmeId:      string | null;
  programmeLibelle: string | null;
  dateDebut:        string;
  dateFin:          string | null;
  numeroDecision:   string | null;
  actif:            boolean;
  valide:           boolean;
}

interface UserSummary {
  id:           string;
  firstName:    string;
  lastName:     string;
  email:        string;
  phoneNumber:  string;
  enabled:      boolean;
  firstLogin:   boolean;
  mfaEnabled:   boolean;
  createdDate:  string;
  role:         string;
  mandats:      Mandat[];
  matricule?:   string | null;
  nui?:         string | null;
  cniNumber?:   string | null;
  agentId?:     string | null;
  dateOfBirth?: string | null;
}

// ── Icônes ──────────────────────────────────────────────────
const IconUsers    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconUserPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>;
const IconEye      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconRefresh  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,11 16,11"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 11"/></svg>;
const IconCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>;
const IconX        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconEmpty    = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const Spinner = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(0,0,0,.1)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

// ── Badge rôle ───────────────────────────────────────────────
const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ADMIN:                   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  MINISTRE:                { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  ORDONNATEUR:             { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  ORDONNATEUR_PRINCIPAL:   { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  ORDONNATEUR_SECONDAIRE:  { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  ORDONNATEUR_DELEGUE:     { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  CONTROLEUR_FINANCIER:    { bg: '#FFF7ED', color: '#92400E', border: '#FCD34D' },
  COMPTABLE:               { bg: '#FDF4FF', color: '#6B21A8', border: '#E9D5FF' },
  GESTIONNAIRE:            { bg: '#F0F2F5', color: '#4A5568', border: '#D1D8E0' },
  AGENT:                   { bg: '#F0F2F5', color: '#4A5568', border: '#D1D8E0' },
};
function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_COLORS[role] ?? { bg: '#F0F2F5', color: '#4A5568', border: '#D1D8E0' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
      {role.replace(/_/g, ' ')}
    </span>
  );
}

function normalizeUser(u: UserSummary): UserSummary {
  return {
    ...u,
    role:    u.role ?? '',
    mandats: Array.isArray(u.mandats) ? u.mandats : [],
  };
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminName,      setAdminName]      = useState('');
  const [users,          setUsers]          = useState<UserSummary[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [pendingIds,     setPendingIds]     = useState<Set<string>>(new Set());
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<UserSummary | null>(null);
  const [search,         setSearch]         = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setPending = (id: string, v: boolean) => {
    setPendingIds(prev => { const n = new Set(prev); v ? n.add(id) : n.delete(id); return n; });
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (!ctx) { router.replace(APP_ROUTES.LOGIN); return; }
    if (ctx.role !== 'ADMIN') { router.replace(APP_ROUTES.DASHBOARD); return; }
    setAdminName(`${ctx.firstName} ${ctx.lastName}`);
  }, [router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USERS, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: UserSummary[] = await res.json();
      setUsers(data.map(normalizeUser));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Impossible de charger les utilisateurs.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleActivate = async (user: UserSummary) => {
    if (pendingIds.has(user.id)) return;
    setPending(user.id, true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USER_ACTIVATE(user.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: true } : u));
      showToast(`Compte de ${user.firstName} ${user.lastName} activé.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'activation.', 'error');
    } finally {
      setPending(user.id, false);
    }
  };

  const handleDeactivate = async (user: UserSummary) => {
    if (pendingIds.has(user.id)) return;
    setPending(user.id, true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USER_DEACTIVATE(user.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, enabled: false } : u));
      showToast(`Compte de ${user.firstName} ${user.lastName} désactivé.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la désactivation.', 'error');
    } finally {
      setPending(user.id, false);
    }
  };

  const handleDelete = async (user: UserSummary) => {
    setPending(user.id, true);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USER_DELETE(user.id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setConfirmDelete(null);
      showToast(`Compte de ${user.firstName} ${user.lastName} supprimé.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'error');
    } finally {
      setPending(user.id, false);
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const mandats = u.mandats ?? [];
    return (
      (u.firstName ?? '').toLowerCase().includes(q) ||
      (u.lastName  ?? '').toLowerCase().includes(q) ||
      (u.email     ?? '').toLowerCase().includes(q) ||
      (u.role      ?? '').toLowerCase().includes(q) ||
      mandats.some(m =>
        (m.roleSysteme    ?? '').toLowerCase().includes(q) ||
        (m.sectionLibelle ?? '').toLowerCase().includes(q) ||
        (m.programmeLibelle ?? '').toLowerCase().includes(q)
      )
    );
  });

  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.enabled).length;
  const inactiveUsers = users.filter(u => !u.enabled).length;
  const firstLogins   = users.filter(u => u.firstLogin).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      <AdminSidebar active="users" adminName={adminName} usersCount={totalUsers} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Gestion des utilisateurs</h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>{totalUsers} utilisateur(s) dans le système</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
              <IconRefresh /> Rafraîchir
            </button>
            <Link href={APP_ROUTES.ADMIN_CREATE_USER} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(13,43,85,.25)' }}>
                <IconUserPlus /> Nouvel utilisateur
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
              { label: 'Total utilisateurs', value: totalUsers,    color: '#0D2B55', icon: <IconUsers /> },
              { label: 'Comptes actifs',     value: activeUsers,   color: '#007A3D', icon: <IconCheck /> },
              { label: 'Comptes inactifs',   value: inactiveUsers, color: '#CE1126', icon: <IconX /> },
              { label: 'Première connexion', value: firstLogins,   color: '#D97706', icon: <IconAlert /> },
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
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Liste des utilisateurs</h2>
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>Agents enregistrés dans le système GBE</p>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E9BAA" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher (nom, email, rôle, section…)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '9px 14px 9px 36px', border: '1.5px solid #E8ECF0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.82rem', width: 320, outline: 'none' }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <Spinner size={36} color="#0D2B55" />
                <p style={{ fontSize: '.875rem' }}>Chargement des utilisateurs…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
                <div style={{ color: '#D1D8E0' }}><IconEmpty /></div>
                <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#4A5568' }}>
                  {search ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur dans le système'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FB' }}>
                      {['Utilisateur', 'Email', 'Rôle', 'Section / Programmes', 'Statut', 'MFA', 'Actions'].map(col => (
                        <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid #E8ECF0', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, idx) => {
                      const isPending  = pendingIds.has(user.id);
                      const mandats    = user.mandats ?? [];
                      const mainMandat = mandats[0];
                      const initials   = `${(user.firstName ?? '?')[0]}${(user.lastName ?? '')[0] ?? ''}`;
                      const programmes = mandats
                        .map(m => m.programmeLibelle)
                        .filter((p): p is string => !!p);

                      const goToDetail = () => {
                        if (!isPending) router.push(APP_ROUTES.ADMIN_USER_DETAIL(user.id));
                      };

                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: idx < filtered.length - 1 ? '1px solid #F0F2F5' : 'none',
                            opacity: isPending ? 0.6 : 1,
                            transition: 'background .15s',
                            cursor: isPending ? 'default' : 'pointer',
                          }}
                          onClick={goToDetail}
                          onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#F8F9FB'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                                {initials}
                              </div>
                              <div>
                                <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55' }}>{user.firstName} {user.lastName}</p>
                                {user.firstLogin && (
                                  <span style={{ fontSize: '.68rem', background: '#FFF7ED', color: '#92400E', border: '1px solid #FCD34D', borderRadius: 4, padding: '1px 6px' }}>
                                    1ère connexion en attente
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px', fontSize: '.82rem', color: '#4A5568', maxWidth: 200 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{user.email}</span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            {user.role
                              ? <RoleBadge role={user.role} />
                              : <span style={{ fontSize: '.75rem', color: '#8E9BAA', fontStyle: 'italic' }}>—</span>}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            {mainMandat ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 240 }}>
                                <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#0D2B55' }}>
                                  {mainMandat.sectionLibelle}
                                </span>
                                {programmes.length > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {programmes.slice(0, 2).map((p, i) => (
                                      <span key={i} style={{ fontSize: '.66rem', padding: '1px 7px', background: '#F0F4F8', color: '#0D2B55', borderRadius: 4, border: '1px solid #D9E2EC' }}>
                                        {p}
                                      </span>
                                    ))}
                                    {programmes.length > 2 && (
                                      <span style={{ fontSize: '.66rem', color: '#8E9BAA' }}>+{programmes.length - 2}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '.7rem', color: '#8E9BAA', fontStyle: 'italic' }}>Aucun programme</span>
                                )}
                                {mandats.length > 1 && (
                                  <span style={{ fontSize: '.66rem', color: '#8E9BAA' }}>
                                    +{mandats.length - 1} autre mandat
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '.78rem', color: '#8E9BAA', fontStyle: 'italic' }}>Aucun mandat</span>
                            )}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, background: user.enabled ? '#F0FDF4' : '#FEF2F2', color: user.enabled ? '#166534' : '#991B1B', border: `1px solid ${user.enabled ? '#BBF7D0' : '#FECACA'}` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.enabled ? '#22C55E' : '#EF4444' }} />
                              {user.enabled ? 'Actif' : 'Inactif'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '.75rem', color: user.mfaEnabled ? '#166534' : '#8E9BAA', fontWeight: 500 }}>
                              {user.mfaEnabled ? '✓ Configuré' : '— Non configuré'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <Link href={APP_ROUTES.ADMIN_USER_DETAIL(user.id)} style={{ textDecoration: 'none' }}>
                                <button title="Voir le détail" disabled={isPending} style={btnStyle('#0D2B5520', '#0D2B55', '#EFF6FF')}>
                                  <IconEye />
                                </button>
                              </Link>

                              <Link href={APP_ROUTES.ADMIN_EDIT_USER(user.id)} style={{ textDecoration: 'none' }}>
                                <button title="Modifier" disabled={isPending} style={btnStyle('#007A3D20', '#007A3D', '#F0FDF4')}>
                                  <IconEdit />
                                </button>
                              </Link>

                              {user.enabled ? (
                                <button title="Désactiver" disabled={isPending} onClick={() => handleDeactivate(user)} style={btnStyle('#CE112620', '#CE1126', '#FEF2F2')}>
                                  {isPending ? <Spinner size={11} color="#CE1126" /> : <IconX />}
                                </button>
                              ) : (
                                <button title="Activer" disabled={isPending} onClick={() => handleActivate(user)} style={btnStyle('#007A3D20', '#007A3D', '#F0FDF4')}>
                                  {isPending ? <Spinner size={11} color="#007A3D" /> : <IconCheck />}
                                </button>
                              )}

                              <button title="Supprimer" disabled={isPending} onClick={() => setConfirmDelete(user)} style={btnStyle('#CE112620', '#CE1126', '#FEF2F2')}>
                                <IconTrash />
                              </button>
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

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'cardReveal .2s ease' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 12 }}>Supprimer ce compte ?</h3>
            <div style={{ padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, marginBottom: 14 }}>
              <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55' }}>{confirmDelete.firstName} {confirmDelete.lastName}</p>
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 3 }}>{confirmDelete.email}</p>
            </div>
            <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: 20 }}>Cette action est irréversible. Tous les mandats seront supprimés.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={pendingIds.has(confirmDelete.id)} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#CE1126', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff' }}>
                {pendingIds.has(confirmDelete.id) ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

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