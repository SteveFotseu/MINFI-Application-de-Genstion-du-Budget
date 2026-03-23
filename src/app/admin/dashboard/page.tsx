'use client';

// ============================================================
// FICHIER  : src/app/admin/dashboard/page.tsx
// RÔLE     : Tableau de bord administrateur GBE-MINFI
//
// FONCTIONNALITÉS :
//   - Vue globale avec statistiques (KPIs)
//   - Liste de tous les utilisateurs avec recherche + filtres
//   - Actions : Ajouter, Modifier, Désactiver, Supprimer
//   - Bouton "Ajouter un utilisateur" → /register
//   - Navigation latérale (sidebar)
//   - Design aux couleurs MINFI
// ============================================================

import React, { useState, useMemo } from 'react';
import Image     from 'next/image';
import Link      from 'next/link';
import { useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/authService';
import { APP_ROUTES }  from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type UserStatus = 'actif' | 'inactif' | 'en_attente';
type UserRole   = 'Ordonnateur' | 'Contrôleur financier' | 'Comptable';

interface AdminUser {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  matricule:   string;
  role:        UserRole;
  section:     string;
  status:      UserStatus;
  createdAt:   string;
  lastLogin?:  string;
}

// ─────────────────────────────────────────────────────────────
// DONNÉES MOCK
// ─────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: '1',  firstName: 'Jean-Baptiste', lastName: 'Nguema',    email: 'jb.nguema@minfi.cm',    phoneNumber: '+237 677 234 567', matricule: 'FP-001234', role: 'Ordonnateur',           section: 'Direction Générale du Budget',          status: 'actif',      createdAt: '2025-01-15', lastLogin: '2026-03-22' },
  { id: '2',  firstName: 'Aminata',       lastName: 'Bello',     email: 'a.bello@minfi.cm',      phoneNumber: '+237 655 123 456', matricule: 'FP-002345', role: 'Contrôleur financier',  section: 'Ministère des Finances (MINFI)',         status: 'actif',      createdAt: '2025-02-03', lastLogin: '2026-03-23' },
  { id: '3',  firstName: 'Pierre',        lastName: 'Mbarga',    email: 'p.mbarga@minfi.cm',     phoneNumber: '+237 699 345 678', matricule: 'FP-003456', role: 'Comptable',             section: 'Direction du Trésor',                   status: 'inactif',    createdAt: '2025-02-18', lastLogin: '2026-02-10' },
  { id: '4',  firstName: 'Fatima',        lastName: 'Oumarou',   email: 'f.oumarou@minfi.cm',    phoneNumber: '+237 678 456 789', matricule: 'FP-004567', role: 'Ordonnateur',           section: 'Ministère de la Santé Publique',         status: 'actif',      createdAt: '2025-03-01', lastLogin: '2026-03-21' },
  { id: '5',  firstName: 'Samuel',        lastName: 'Tchoumba',  email: 's.tchoumba@minfi.cm',   phoneNumber: '+237 691 567 890', matricule: 'FP-005678', role: 'Contrôleur financier',  section: 'Ministère de l\'Éducation de Base',      status: 'en_attente', createdAt: '2026-03-10' },
  { id: '6',  firstName: 'Marie-Claire',  lastName: 'Abanda',    email: 'mc.abanda@minfi.cm',    phoneNumber: '+237 677 678 901', matricule: 'FP-006789', role: 'Comptable',             section: 'Ministère des Travaux Publics',          status: 'actif',      createdAt: '2025-04-12', lastLogin: '2026-03-20' },
  { id: '7',  firstName: 'Alain',         lastName: 'Foko',      email: 'a.foko@minfi.cm',       phoneNumber: '+237 655 789 012', matricule: 'FP-007890', role: 'Ordonnateur',           section: 'Ministère du Plan',                     status: 'actif',      createdAt: '2025-05-08', lastLogin: '2026-03-19' },
  { id: '8',  firstName: 'Carine',        lastName: 'Ngo Biyack',email: 'c.ngobiyack@minfi.cm',  phoneNumber: '+237 699 890 123', matricule: 'FP-008901', role: 'Contrôleur financier',  section: 'Ministère de l\'Agriculture',            status: 'inactif',    createdAt: '2025-06-22', lastLogin: '2026-01-15' },
  { id: '9',  firstName: 'Éric',          lastName: 'Manga',     email: 'e.manga@minfi.cm',      phoneNumber: '+237 678 901 234', matricule: 'FP-009012', role: 'Comptable',             section: 'Ministère de la Justice',               status: 'actif',      createdAt: '2025-07-14', lastLogin: '2026-03-22' },
  { id: '10', firstName: 'Bernadette',    lastName: 'Kom',       email: 'b.kom@minfi.cm',        phoneNumber: '+237 691 012 345', matricule: 'FP-010123', role: 'Ordonnateur',           section: 'Présidence de la République',           status: 'en_attente', createdAt: '2026-03-18' },
  { id: '11', firstName: 'Hervé',         lastName: 'Njoya',     email: 'h.njoya@minfi.cm',      phoneNumber: '+237 677 123 456', matricule: 'FP-011234', role: 'Contrôleur financier',  section: 'Ministère des Transports',              status: 'actif',      createdAt: '2025-08-05', lastLogin: '2026-03-21' },
  { id: '12', firstName: 'Sylvie',        lastName: 'Eyebe',     email: 's.eyebe@minfi.cm',      phoneNumber: '+237 655 234 567', matricule: 'FP-012345', role: 'Comptable',             section: 'Ministère de l\'Eau et de l\'Énergie',   status: 'actif',      createdAt: '2025-09-19', lastLogin: '2026-03-20' },
];

// ─────────────────────────────────────────────────────────────
// CONSTANTES UI
// ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  actif:      { label: 'Actif',       color: '#166534', bg: '#F0FDF4', dot: '#22C55E' },
  inactif:    { label: 'Inactif',     color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
  en_attente: { label: 'En attente',  color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
};

const ROLE_COLORS: Record<UserRole, string> = {
  'Ordonnateur':          '#0D2B55',
  'Contrôleur financier': '#007A3D',
  'Comptable':            '#7C3AED',
};

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG
// ─────────────────────────────────────────────────────────────
const Icons = {
  Dashboard:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Users:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Plus:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>,
  Edit:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Power:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Logout:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Eye:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ChevronDown:() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9"/></svg>,
  Bell:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Settings:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M4.93 4.93l1.41 1.41M21 12h-2M3 12H1M12 21v-2M12 3V1"/></svg>,
  Chart:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  X:          () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  Warning:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// COMPOSANT MODAL CONFIRMATION
// ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen:   boolean;
  type:     'delete' | 'disable' | 'enable' | 'view';
  user:     AdminUser | null;
  onClose:  () => void;
  onConfirm:() => void;
}

function ConfirmModal({ isOpen, type, user, onClose, onConfirm }: ConfirmModalProps) {
  if (!isOpen || !user) return null;

  const config = {
    delete:  { title: 'Supprimer le compte',    msg: `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user.firstName} ${user.lastName} ? Cette action est irréversible.`, btnLabel: 'Supprimer', btnColor: '#CE1126', icon: <Icons.Trash /> },
    disable: { title: 'Désactiver le compte',   msg: `Le compte de ${user.firstName} ${user.lastName} sera désactivé. L'utilisateur ne pourra plus se connecter.`, btnLabel: 'Désactiver', btnColor: '#D97706', icon: <Icons.Power /> },
    enable:  { title: 'Réactiver le compte',    msg: `Le compte de ${user.firstName} ${user.lastName} sera réactivé. L'utilisateur pourra à nouveau se connecter.`, btnLabel: 'Réactiver', btnColor: '#007A3D', icon: <Icons.Check /> },
    view:    { title: 'Détails utilisateur',    msg: '', btnLabel: 'Fermer', btnColor: '#0D2B55', icon: <Icons.Eye /> },
  };
  const c = config[type];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn .2s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        maxWidth: type === 'view' ? 520 : 440,
        width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,.25)',
        animation: 'slideUp .25s cubic-bezier(.22,.68,0,1.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `${c.btnColor}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c.btnColor,
          }}>
            {c.icon}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#0D2B55' }}>
            {c.title}
          </h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', padding: 4 }}>
            <Icons.X />
          </button>
        </div>

        {type === 'view' ? (
          /* Fiche détaillée utilisateur */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Avatar + nom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'rgba(13,43,85,.04)', borderRadius: 10 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0,
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#0D2B55', fontSize: '.95rem' }}>{user.firstName} {user.lastName}</p>
                <p style={{ fontSize: '.8rem', color: '#8E9BAA' }}>{user.email}</p>
              </div>
              <span style={{
                marginLeft: 'auto',
                padding: '3px 10px', borderRadius: 999,
                background: STATUS_CONFIG[user.status].bg,
                color: STATUS_CONFIG[user.status].color,
                fontSize: '.72rem', fontWeight: 600,
              }}>
                {STATUS_CONFIG[user.status].label}
              </span>
            </div>
            {/* Infos détaillées */}
            {[
              ['Matricule', user.matricule],
              ['Rôle', user.role],
              ['Section', user.section],
              ['Téléphone', user.phoneNumber],
              ['Date d\'inscription', new Date(user.createdAt).toLocaleDateString('fr-FR')],
              ['Dernière connexion', user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E8ECF0' }}>
                <span style={{ fontSize: '.82rem', color: '#8E9BAA', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '.82rem', color: '#1A202C', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '.875rem', color: '#4A5568', lineHeight: 1.6 }}>{c.msg}</p>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: '1.5px solid #E8ECF0', borderRadius: 8,
            background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontSize: '.875rem', color: '#4A5568', fontWeight: 500,
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8,
            background: c.btnColor, cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontSize: '.875rem', color: '#fff', fontWeight: 600,
            boxShadow: `0 4px 12px ${c.btnColor}40`,
          }}>
            {c.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();

  // ── État ──
  const [users,        setUsers]        = useState<AdminUser[]>(MOCK_USERS);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'tous'>('tous');
  const [filterRole,   setFilterRole]   = useState<UserRole | 'tous'>('tous');
  const [activeNav,    setActiveNav]    = useState('utilisateurs');
  const [modal,        setModal]        = useState<{ type: ConfirmModalProps['type']; user: AdminUser | null }>({ type: 'view', user: null });
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── KPIs ──
  const stats = useMemo(() => ({
    total:      users.length,
    actifs:     users.filter(u => u.status === 'actif').length,
    inactifs:   users.filter(u => u.status === 'inactif').length,
    en_attente: users.filter(u => u.status === 'en_attente').length,
  }), [users]);

  // ── Filtrage ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch = !q || [u.firstName, u.lastName, u.email, u.matricule, u.section, u.role]
        .some(f => f.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'tous' || u.status === filterStatus;
      const matchRole   = filterRole   === 'tous' || u.role   === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, filterStatus, filterRole]);

  // ── Helpers ──
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (type: ConfirmModalProps['type'], user: AdminUser) => {
    setModal({ type, user });
  };

  const handleConfirm = () => {
    const user = modal.user;
    if (!user) return;

    if (modal.type === 'delete') {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été supprimé.`);
    } else if (modal.type === 'disable') {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'inactif' } : u));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été désactivé.`);
    } else if (modal.type === 'enable') {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'actif' } : u));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été réactivé.`);
    }
    setModal({ type: 'view', user: null });
  };

  const handleLogout = () => {
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ══════════════════════════════════════════
          SIDEBAR
          ══════════════════════════════════════════ */}
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,.25)',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>Administration</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>
            Navigation
          </p>

          {[
            { id: 'dashboard',    label: 'Vue d\'ensemble', icon: <Icons.Dashboard /> },
            { id: 'utilisateurs', label: 'Utilisateurs',    icon: <Icons.Users /> },
            { id: 'statistiques', label: 'Statistiques',    icon: <Icons.Chart /> },
            { id: 'parametres',   label: 'Paramètres',      icon: <Icons.Settings /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '.85rem',
                fontWeight: activeNav === item.id ? 600 : 400,
                color: activeNav === item.id ? '#fff' : 'rgba(255,255,255,.55)',
                background: activeNav === item.id
                  ? 'rgba(255,255,255,.12)'
                  : 'transparent',
                transition: 'all .15s ease',
                textAlign: 'left',
              }}
            >
              <span style={{ opacity: activeNav === item.id ? 1 : .6 }}>{item.icon}</span>
              {item.label}
              {item.id === 'utilisateurs' && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#FCD116',
                  color: '#0D2B55',
                  borderRadius: 999,
                  fontSize: '.65rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                }}>
                  {stats.total}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bandes tricolores + déconnexion */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {/* Admin info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #CE1126, #8B0914)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '.75rem', fontWeight: 700, flexShrink: 0,
            }}>
              AD
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Administrateur</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)' }}>Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8,
              background: 'rgba(255,255,255,.06)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '.82rem', fontWeight: 500,
              color: 'rgba(255,255,255,.6)',
            }}
          >
            <Icons.Logout />
            Déconnexion
          </button>
        </div>

        {/* Bandes tricolores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          <div style={{ background: '#FCD116' }} />
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          CONTENU PRINCIPAL
          ══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* TOPBAR */}
        <header style={{
          background: '#fff',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E8ECF0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              Gestion des utilisateurs · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Cloche notif */}
            <button style={{
              position: 'relative',
              width: 38, height: 38,
              border: '1px solid #E8ECF0',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4A5568',
            }}>
              <Icons.Bell />
              {stats.en_attente > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8,
                  background: '#CE1126',
                  borderRadius: '50%',
                  border: '1.5px solid #fff',
                }} />
              )}
            </button>

            {/* Bouton ajouter */}
            <Link href={APP_ROUTES.REGISTER}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: '.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 4px 12px rgba(13,43,85,.25)',
                transition: 'all .15s ease',
              }}>
                <Icons.Plus />
                Ajouter un utilisateur
              </button>
            </Link>
          </div>
        </header>

        {/* CONTENU SCROLLABLE */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ── KPIs ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginBottom: 28,
          }}>
            {[
              { label: 'Total utilisateurs', value: stats.total,      color: '#0D2B55', bg: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', icon: '👥', change: '+3 ce mois' },
              { label: 'Comptes actifs',     value: stats.actifs,     color: '#007A3D', bg: 'linear-gradient(135deg, #005A2D, #009A4E)', icon: '✅', change: `${Math.round(stats.actifs/stats.total*100)}% du total` },
              { label: 'Comptes inactifs',   value: stats.inactifs,   color: '#CE1126', bg: 'linear-gradient(135deg, #8B0914, #CE1126)', icon: '⛔', change: 'Accès révoqué' },
              { label: 'En attente',         value: stats.en_attente, color: '#D97706', bg: 'linear-gradient(135deg, #92400E, #F59E0B)', icon: '⏳', change: 'Validation requise' },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 14,
                padding: '20px 22px',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                border: '1px solid #E8ECF0',
                position: 'relative',
                overflow: 'hidden',
                animation: `cardReveal .4s ${i * .07}s cubic-bezier(.22,.68,0,1.2) both`,
              }}>
                {/* Accent couleur en haut */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.bg }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '.75rem', color: '#8E9BAA', fontWeight: 500, marginBottom: 6 }}>{kpi.label}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                      {kpi.value}
                    </p>
                    <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 6 }}>{kpi.change}</p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${kpi.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}>
                    {kpi.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Répartition par rôle ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 12,
            marginBottom: 28,
          }}>
            {(Object.keys(ROLE_COLORS) as UserRole[]).map(role => {
              const count = users.filter(u => u.role === role).length;
              const pct   = Math.round(count / users.length * 100);
              return (
                <div key={role} style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '14px 16px',
                  border: '1px solid #E8ECF0',
                  boxShadow: '0 1px 6px rgba(0,0,0,.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '.78rem', color: '#4A5568', fontWeight: 500 }}>{role}</span>
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700,
                      color: ROLE_COLORS[role],
                      background: `${ROLE_COLORS[role]}12`,
                      padding: '2px 8px', borderRadius: 999,
                    }}>{count}</span>
                  </div>
                  {/* Barre de progression */}
                  <div style={{ height: 4, background: '#E8ECF0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: ROLE_COLORS[role],
                      borderRadius: 999,
                      transition: 'width .6s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '.68rem', color: '#8E9BAA', marginTop: 4 }}>{pct}% du total</p>
                </div>
              );
            })}
          </div>

          {/* ── Table utilisateurs ── */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #E8ECF0',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
            overflow: 'hidden',
          }}>

            {/* Header table avec filtres */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E8ECF0',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>
                  Tous les utilisateurs
                </h2>
                <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {users.length}
                </p>
              </div>

              {/* Barre de recherche */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8E9BAA' }}>
                  <Icons.Search />
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, matricule…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    border: '1.5px solid #E8ECF0',
                    borderRadius: 8,
                    paddingLeft: 36,
                    paddingRight: 12,
                    fontFamily: 'var(--font-body)',
                    fontSize: '.82rem',
                    color: '#1A202C',
                    outline: 'none',
                    background: '#F5F6FA',
                  }}
                />
              </div>

              {/* Filtre statut */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as UserStatus | 'tous')}
                style={{
                  height: 38, padding: '0 12px',
                  border: '1.5px solid #E8ECF0', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: '.82rem',
                  color: '#4A5568', background: '#F5F6FA', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="tous">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="en_attente">En attente</option>
              </select>

              {/* Filtre rôle */}
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as UserRole | 'tous')}
                style={{
                  height: 38, padding: '0 12px',
                  border: '1.5px solid #E8ECF0', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: '.82rem',
                  color: '#4A5568', background: '#F5F6FA', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="tous">Tous les rôles</option>
                <option value="Ordonnateur">Ordonnateur</option>
                <option value="Contrôleur financier">Contrôleur financier</option>
                <option value="Comptable">Comptable</option>
                {/* ℹ️ Le rôle Administrateur est géré séparément — non affiché ici */}
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F9FB' }}>
                    {['Utilisateur', 'Matricule', 'Rôle', 'Section', 'Statut', 'Dernière connexion', 'Actions'].map(col => (
                      <th key={col} style={{
                        padding: '11px 16px',
                        textAlign: 'left',
                        fontSize: '.72rem',
                        fontWeight: 600,
                        color: '#8E9BAA',
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid #E8ECF0',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#8E9BAA', fontSize: '.875rem' }}>
                        Aucun utilisateur trouvé pour « {search} »
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user, i) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: '1px solid #F0F2F5',
                          transition: 'background .12s ease',
                          animation: `fadeSlideDown .3s ${i * .04}s ease both`,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Utilisateur */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${ROLE_COLORS[user.role]}cc, ${ROLE_COLORS[user.role]})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '.78rem', fontWeight: 700, flexShrink: 0,
                            }}>
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                              <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#1A202C' }}>
                                {user.firstName} {user.lastName}
                              </p>
                              <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Matricule */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.8rem',
                            color: '#4A5568',
                            background: '#F0F2F5',
                            padding: '3px 8px',
                            borderRadius: 4,
                          }}>
                            {user.matricule}
                          </span>
                        </td>

                        {/* Rôle */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '.75rem',
                            fontWeight: 600,
                            color: ROLE_COLORS[user.role],
                            background: `${ROLE_COLORS[user.role]}12`,
                            padding: '3px 10px',
                            borderRadius: 999,
                          }}>
                            {user.role}
                          </span>
                        </td>

                        {/* Section */}
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ fontSize: '.78rem', color: '#4A5568', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.section}
                          </p>
                        </td>

                        {/* Statut */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: STATUS_CONFIG[user.status].dot,
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: '.75rem',
                              fontWeight: 600,
                              color: STATUS_CONFIG[user.status].color,
                              background: STATUS_CONFIG[user.status].bg,
                              padding: '3px 10px',
                              borderRadius: 999,
                            }}>
                              {STATUS_CONFIG[user.status].label}
                            </span>
                          </div>
                        </td>

                        {/* Dernière connexion */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <p style={{ fontSize: '.78rem', color: '#8E9BAA' }}>
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString('fr-FR')
                              : <span style={{ color: '#FCD116', fontWeight: 600 }}>Jamais connecté</span>
                            }
                          </p>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* Voir */}
                            <button
                              title="Voir les détails"
                              onClick={() => handleAction('view', user)}
                              style={actionBtn('#4A5568', '#F0F2F5')}
                            >
                              <Icons.Eye />
                            </button>

                            {/* Modifier → vers register avec userId */}
                            {/* Modifier → page d'édition dédiée avec pré-remplissage des données */}
                            <Link href={`/admin/users/edit/${user.id}`}>
                              <button title="Modifier les informations" style={actionBtn('#007A3D', '#F0FDF4')}>
                                <Icons.Edit />
                              </button>
                            </Link>

                            {/* Activer / Désactiver */}
                            {user.status === 'actif' || user.status === 'en_attente' ? (
                              <button
                                title="Désactiver"
                                onClick={() => handleAction('disable', user)}
                                style={actionBtn('#D97706', '#FFFBEB')}
                              >
                                <Icons.Power />
                              </button>
                            ) : (
                              <button
                                title="Réactiver"
                                onClick={() => handleAction('enable', user)}
                                style={actionBtn('#007A3D', '#F0FDF4')}
                              >
                                <Icons.Check />
                              </button>
                            )}

                            {/* Supprimer */}
                            <button
                              title="Supprimer"
                              onClick={() => handleAction('delete', user)}
                              style={actionBtn('#CE1126', '#FEF2F2')}
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer table */}
            {filtered.length > 0 && (
              <div style={{
                padding: '12px 24px',
                borderTop: '1px solid #E8ECF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <p style={{ fontSize: '.78rem', color: '#8E9BAA' }}>
                  Affichage de <strong style={{ color: '#4A5568' }}>{filtered.length}</strong> utilisateur{filtered.length > 1 ? 's' : ''}
                  {(filterStatus !== 'tous' || filterRole !== 'tous' || search) && (
                    <button
                      onClick={() => { setSearch(''); setFilterStatus('tous'); setFilterRole('tous'); }}
                      style={{ marginLeft: 8, color: '#0D2B55', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.78rem' }}
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </p>
                <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>
                  Données au {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* ── Modal ── */}
      <ConfirmModal
        isOpen={modal.user !== null}
        type={modal.type}
        user={modal.user}
        onClose={() => setModal({ type: 'view', user: null })}
        onConfirm={handleConfirm}
      />

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px',
          borderRadius: 10,
          background: toast.type === 'success' ? '#0D2B55' : '#CE1126',
          color: '#fff',
          fontSize: '.85rem',
          fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          animation: 'slideUp .3s cubic-bezier(.22,.68,0,1.2)',
          maxWidth: 360,
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// Utilitaire style bouton action
function actionBtn(color: string, bg: string): React.CSSProperties {
  return {
    width: 30, height: 30,
    border: `1px solid ${color}30`,
    borderRadius: 6,
    background: bg,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: color,
    transition: 'all .15s ease',
  };
}