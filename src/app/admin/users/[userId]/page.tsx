'use client';

// ============================================================
// FICHIER  : src/app/admin/users/[userId]/page.tsx
// ROUTE    : /admin/users/{userId}
// RÔLE     : Affiche le détail complet d'un utilisateur.
//
// FONCTIONNALITÉS :
//   - Identité complète (nom, email, téléphone, matricule, NUI, CNI…)
//   - Statut compte (actif/inactif, 1ère connexion, MFA)
//   - Rôle système (badge)
//   - Liste détaillée des mandats (rôle, section, programme,
//     dates, décision, validité)
//   - Actions : modifier, activer/désactiver, supprimer, retour
//
// SOURCE BACKEND :
//   GET    /api/v1/admin/users/{userId}
//   PATCH  /api/v1/admin/users/{userId}/activate
//   PATCH  /api/v1/admin/users/{userId}/deactivate
//   DELETE /api/v1/admin/users/{userId}
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS } from '@/constants/auth';

// ── Types ────────────────────────────────────────────────────
// Mandat : utilise une définition locale plus permissive que celle
// de types/auth.ts (les champs sectionCode, programmeCode, permissions
// peuvent manquer dans la réponse admin/users/{id}).
interface Mandat {
  mandatId:         string;
  roleSysteme:      string;
  sectionId:        string;
  sectionLibelle:   string;
  sectionCode?:     string;
  programmeId:      string | null;
  programmeLibelle: string | null;
  programmeCode?:   string | null;
  permissions?:     string[];
  dateDebut:        string;
  dateFin:          string | null;
  numeroDecision:   string | null;
  actif:            boolean;
  valide:           boolean;
}

interface UserDetail {
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
  // Champs optionnels (selon le profil de l'utilisateur)
  matricule?:   string | null;
  nui?:         string | null;
  cniNumber?:   string | null;
  agentId?:     string | null;
  dateOfBirth?: string | null;
}

// ── Icônes ──────────────────────────────────────────────────
const IconArrow    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>;
const IconX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconLogout   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconMail     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>;
const IconID       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;
const IconCal      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconShield   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconBriefcase= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconBuilding = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="9" y1="6" x2="9" y2="8"/><line x1="15" y1="6" x2="15" y2="8"/><line x1="9" y1="11" x2="9" y2="13"/><line x1="15" y1="11" x2="15" y2="13"/></svg>;

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
function RoleBadge({ role, large = false }: { role: string; large?: boolean }) {
  const cfg = ROLE_COLORS[role] ?? { bg: '#F0F2F5', color: '#4A5568', border: '#D1D8E0' };
  const label = role.replace(/_/g, ' ');
  return (
    <span style={{
      padding: large ? '5px 14px' : '2px 10px',
      borderRadius: 999,
      fontSize: large ? '.82rem' : '.7rem',
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ── Helper : ligne d'info clé/valeur ─────────────────────────
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

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [adminName,     setAdminName]     = useState('');
  const [user,          setUser]          = useState<UserDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  // ── Chargement du détail utilisateur ──
  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Utilisateur introuvable');
        throw new Error(`Erreur ${res.status}`);
      }
      const data: UserDetail = await res.json();
      // Garantir mandats[] toujours présent
      setUser({ ...data, mandats: Array.isArray(data.mandats) ? data.mandats : [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ── Activer / Désactiver ──
  const handleToggleActive = async () => {
    if (!user || actionPending) return;
    const isActivating = !user.enabled;
    setActionPending(isActivating ? 'activate' : 'deactivate');
    try {
      const token = getAccessToken();
      const url = isActivating
        ? ADMIN_ENDPOINTS.USER_ACTIVATE(user.id)
        : ADMIN_ENDPOINTS.USER_DEACTIVATE(user.id);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setUser({ ...user, enabled: isActivating });
      showToast(`Compte ${isActivating ? 'activé' : 'désactivé'} avec succès.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de l\'opération.', 'error');
    } finally {
      setActionPending(null);
    }
  };

  // ── Supprimer ──
  const handleDelete = async () => {
    if (!user || actionPending) return;
    setActionPending('delete');
    try {
      const token = getAccessToken();
      const res = await fetch(ADMIN_ENDPOINTS.USER_DELETE(user.id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      showToast(`Compte supprimé.`);
      // Petit délai pour laisser voir le toast avant la redirection
      setTimeout(() => router.push(APP_ROUTES.ADMIN_DASHBOARD), 800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'error');
      setActionPending(null);
      setConfirmDelete(false);
    }
  };

  const initials = user
    ? `${(user.firstName ?? '?')[0]}${(user.lastName ?? '')[0] ?? ''}`
    : '?';

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{ width: 240, flexShrink: 0, background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 50 }}>
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

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>
          <Link href={APP_ROUTES.ADMIN_DASHBOARD} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)' }}>
              <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#fff' }}>Tableau de bord</span>
            </div>
          </Link>

          {adminName && (
            <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }}>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Connecté en tant que</p>
              <p style={{ fontSize: '.82rem', color: '#FCD116', fontWeight: 600 }}>{adminName}</p>
              <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Administrateur système</p>
            </div>
          )}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>
            <IconLogout /> Déconnexion
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div style={{ background: '#FCD116' }} />
        </div>
      </aside>

      {/* ════ CONTENU ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href={APP_ROUTES.ADMIN_DASHBOARD} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
                <IconArrow /> Retour
              </button>
            </Link>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Détail de l'utilisateur</h1>
              <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>Informations complètes et mandats</p>
            </div>
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

          {/* ── Loading ── */}
          {loading && (
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#8E9BAA' }}>
              <Spinner size={40} color="#0D2B55" />
              <p style={{ fontSize: '.875rem' }}>Chargement de l'utilisateur…</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div style={{ maxWidth: 600, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 14, border: '1px solid #FECACA', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#CE1126' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 8 }}>{error}</h2>
              <p style={{ fontSize: '.875rem', color: '#8E9BAA', marginBottom: 20 }}>Vérifiez l'identifiant ou retournez à la liste.</p>
              <Link href={APP_ROUTES.ADMIN_DASHBOARD} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#0D2B55', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff' }}>
                  Retour à la liste
                </button>
              </Link>
            </div>
          )}

          {/* ── Détail ── */}
          {!loading && !error && user && (
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>

              {/* ═══ COLONNE GAUCHE : Profil + Actions ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Carte profil */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  {/* Bandeau dégradé */}
                  <div style={{ height: 80, background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A227, #E0B533)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D2B55', fontWeight: 700, fontSize: '1.6rem', border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>
                      {initials}
                    </div>
                  </div>

                  <div style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#0D2B55' }}>{user.firstName} {user.lastName}</h2>
                    <p style={{ fontSize: '.82rem', color: '#8E9BAA', marginTop: 4 }}>{user.email}</p>

                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                      <RoleBadge role={user.role} large />
                    </div>

                    {/* Statuts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8F9FB', borderRadius: 8 }}>
                        <span style={{ fontSize: '.78rem', color: '#4A5568' }}>Statut du compte</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 600, background: user.enabled ? '#F0FDF4' : '#FEF2F2', color: user.enabled ? '#166534' : '#991B1B', border: `1px solid ${user.enabled ? '#BBF7D0' : '#FECACA'}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.enabled ? '#22C55E' : '#EF4444' }} />
                          {user.enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8F9FB', borderRadius: 8 }}>
                        <span style={{ fontSize: '.78rem', color: '#4A5568' }}>Authentification 2FA</span>
                        <span style={{ fontSize: '.78rem', fontWeight: 500, color: user.mfaEnabled ? '#166534' : '#8E9BAA' }}>
                          {user.mfaEnabled ? '✓ Configuré' : '— Non configuré'}
                        </span>
                      </div>

                      {user.firstLogin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FCD34D', borderRadius: 8 }}>
                          <span style={{ fontSize: '.78rem', color: '#92400E', fontWeight: 500 }}>⚠ Première connexion en attente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55', marginBottom: 14 }}>Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link href={APP_ROUTES.ADMIN_EDIT_USER(user.id)} style={{ textDecoration: 'none' }}>
                      <button style={actionBtnStyle('#007A3D', '#F0FDF4', '#BBF7D0')}>
                        <IconEdit /> Modifier les informations
                      </button>
                    </Link>

                    <button
                      onClick={handleToggleActive}
                      disabled={actionPending !== null}
                      style={actionBtnStyle(user.enabled ? '#CE1126' : '#007A3D', user.enabled ? '#FEF2F2' : '#F0FDF4', user.enabled ? '#FECACA' : '#BBF7D0')}
                    >
                      {actionPending === 'activate' || actionPending === 'deactivate'
                        ? <Spinner size={13} color={user.enabled ? '#CE1126' : '#007A3D'} />
                        : (user.enabled ? <IconX /> : <IconCheck />)}
                      {user.enabled ? 'Désactiver le compte' : 'Activer le compte'}
                    </button>

                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={actionPending !== null}
                      style={actionBtnStyle('#CE1126', '#FEF2F2', '#FECACA')}
                    >
                      <IconTrash /> Supprimer le compte
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══ COLONNE DROITE : Identité + Mandats ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Carte identité */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 4, height: 18, background: '#C9A227', borderRadius: 2 }} />
                    Informations d'identité
                  </h3>
                  <div>
                    <InfoRow icon={<IconMail />}      label="Email"            value={user.email} />
                    <InfoRow icon={<IconPhone />}     label="Téléphone"        value={user.phoneNumber} />
                    <InfoRow icon={<IconID />}        label="Matricule"        value={user.matricule} />
                    <InfoRow icon={<IconID />}        label="NUI"              value={user.nui} />
                    <InfoRow icon={<IconID />}        label="Numéro CNI"       value={user.cniNumber} />
                    <InfoRow icon={<IconCal />}      label="Date de naissance" value={formatDate(user.dateOfBirth)} />
                    <InfoRow icon={<IconBriefcase />} label="ID Agent lié"     value={user.agentId ? <code style={{ fontSize: '.78rem', background: '#F8F9FB', padding: '2px 6px', borderRadius: 4 }}>{user.agentId}</code> : null} />
                    <InfoRow icon={<IconCal />}       label="Compte créé le"   value={formatDate(user.createdDate)} />
                  </div>
                </div>

                {/* Carte mandats */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 4, height: 18, background: '#C9A227', borderRadius: 2 }} />
                      Mandats & Affectations
                    </h3>
                    <span style={{ fontSize: '.7rem', padding: '2px 10px', borderRadius: 999, background: '#F0F4F8', color: '#0D2B55', fontWeight: 600 }}>
                      {user.mandats.length} mandat{user.mandats.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {user.mandats.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', background: '#F8F9FB', borderRadius: 10, border: '1px dashed #D1D8E0' }}>
                      <p style={{ fontSize: '.82rem', color: '#8E9BAA', fontStyle: 'italic' }}>Aucun mandat enregistré pour cet utilisateur.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {user.mandats.map((m, idx) => (
                        <div key={m.mandatId} style={{ border: '1px solid #E8ECF0', borderRadius: 12, padding: 16, background: m.actif ? '#fff' : '#FAFBFC', position: 'relative' }}>
                          {/* En-tête du mandat */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0D2B55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.78rem' }}>
                                {idx + 1}
                              </div>
                              <div>
                                <RoleBadge role={m.roleSysteme} />
                                <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 4 }}>
                                  ID : <code style={{ fontSize: '.7rem', background: '#F8F9FB', padding: '1px 5px', borderRadius: 3 }}>{m.mandatId.slice(0, 8)}…</code>
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontSize: '.66rem', padding: '2px 8px', borderRadius: 999, background: m.actif ? '#F0FDF4' : '#FEF2F2', color: m.actif ? '#166534' : '#991B1B', border: `1px solid ${m.actif ? '#BBF7D0' : '#FECACA'}`, fontWeight: 600 }}>
                                {m.actif ? '● Actif' : '○ Inactif'}
                              </span>
                              <span style={{ fontSize: '.66rem', padding: '2px 8px', borderRadius: 999, background: m.valide ? '#EFF6FF' : '#FFF7ED', color: m.valide ? '#1D4ED8' : '#92400E', border: `1px solid ${m.valide ? '#BFDBFE' : '#FCD34D'}`, fontWeight: 600 }}>
                                {m.valide ? '✓ Validé' : '⏳ En attente'}
                              </span>
                            </div>
                          </div>

                          {/* Détails du mandat */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '.78rem' }}>
                            <div>
                              <p style={{ fontSize: '.66rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                <IconBuilding /> Section
                              </p>
                              <p style={{ color: '#0D2B55', fontWeight: 500 }}>{m.sectionLibelle}</p>
                              {m.sectionCode && <p style={{ fontSize: '.7rem', color: '#8E9BAA' }}>Code : {m.sectionCode}</p>}
                            </div>

                            <div>
                              <p style={{ fontSize: '.66rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                <IconBriefcase /> Programme
                              </p>
                              {m.programmeLibelle ? (
                                <>
                                  <p style={{ color: '#0D2B55', fontWeight: 500 }}>{m.programmeLibelle}</p>
                                  {m.programmeCode && <p style={{ fontSize: '.7rem', color: '#8E9BAA' }}>Code : {m.programmeCode}</p>}
                                </>
                              ) : (
                                <p style={{ color: '#B0BBC8', fontStyle: 'italic' }}>—</p>
                              )}
                            </div>

                            <div>
                              <p style={{ fontSize: '.66rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                <IconCal /> Période
                              </p>
                              <p style={{ color: '#0D2B55', fontWeight: 500 }}>
                                Du {formatDate(m.dateDebut)}
                                {m.dateFin ? ` au ${formatDate(m.dateFin)}` : ' (en cours)'}
                              </p>
                            </div>

                            <div>
                              <p style={{ fontSize: '.66rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                <IconShield /> N° Décision
                              </p>
                              {m.numeroDecision
                                ? <p style={{ color: '#0D2B55', fontWeight: 500 }}>{m.numeroDecision}</p>
                                : <p style={{ color: '#B0BBC8', fontStyle: 'italic' }}>—</p>}
                            </div>
                          </div>

                          {/* Permissions (si présentes) */}
                          {m.permissions && m.permissions.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F2F5' }}>
                              <p style={{ fontSize: '.66rem', color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                                Permissions ({m.permissions.length})
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {m.permissions.map((p, i) => (
                                  <span key={i} style={{ fontSize: '.66rem', padding: '2px 8px', background: '#F0F4F8', color: '#0D2B55', borderRadius: 4, border: '1px solid #D9E2EC' }}>
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && user && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget && actionPending !== 'delete') setConfirmDelete(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'cardReveal .2s ease' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 12 }}>Supprimer ce compte ?</h3>
            <div style={{ padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, marginBottom: 14 }}>
              <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55' }}>{user.firstName} {user.lastName}</p>
              <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 3 }}>{user.email}</p>
            </div>
            <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: 20 }}>Cette action est irréversible. Tous les mandats associés seront supprimés.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} disabled={actionPending === 'delete'} style={{ padding: '9px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={actionPending === 'delete'} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#CE1126', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {actionPending === 'delete' ? <><Spinner size={13} /> Suppression…</> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
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