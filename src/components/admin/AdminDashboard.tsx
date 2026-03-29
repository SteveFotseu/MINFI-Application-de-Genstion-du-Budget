'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearTokens, getAccessToken, getUserContext } from '@/lib/authService';
import { ADMIN_ENDPOINTS, APP_ROUTES } from '@/constants/auth';

interface BackendAffectation {
  affectationId: string;
  roleSysteme: string;
  sectionId: string;
  sectionLibelle: string;
  programmeId: string;
  programmeLibelle: string;
  actif: boolean;
}

export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  matricule: string | null;
  cniNumber: string | null;
  enabled: boolean;
  firstLogin: boolean;
  mfaEnabled: boolean;
  createdDate: string;
  role: string;
  affectations: BackendAffectation[];
}

function getStatus(user: BackendUser): 'actif' | 'inactif' | 'en_attente' {
  if (user.firstLogin) return 'en_attente';
  if (!user.enabled) return 'inactif';
  return 'actif';
}

function formatRole(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrateur',
    ORDONNATEUR_PRINCIPAL: 'Ordonnateur Principal',
    ORDONNATEUR_SECONDAIRE: 'Ordonnateur Secondaire',
    ORDONNATEUR_DELEGUE: 'Ordonnateur Délégué',
    CONTROLEUR_FINANCIER: 'Contrôleur Financier',
    COMPTABLE: 'Comptable',
  };
  return labels[role] ?? role;
}

function getSection(user: BackendUser): string {
  if (!user.affectations || user.affectations.length === 0) return '—';
  const active = user.affectations.find(a => a.actif) ?? user.affectations[0];
  return active.sectionLibelle;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  actif: { label: 'Actif', color: '#166534', bg: '#F0FDF4', dot: '#22C55E' },
  inactif: { label: 'Inactif', color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
  en_attente: { label: 'En attente', color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#CE1126',
  ORDONNATEUR_PRINCIPAL: '#0D2B55',
  ORDONNATEUR_SECONDAIRE: '#1A3A6B',
  ORDONNATEUR_DELEGUE: '#2451A0',
  CONTROLEUR_FINANCIER: '#007A3D',
  COMPTABLE: '#7C3AED',
};

const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Power: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M4.93 4.93l1.41 1.41M21 12h-2M3 12H1M12 21v-2M12 3V1" />
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,11 16,11" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 11" />
    </svg>
  ),
};

interface ConfirmModalProps {
  isOpen: boolean;
  type: 'delete' | 'disable' | 'enable' | 'view';
  user: BackendUser | null;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ isOpen, type, user, onClose, onConfirm }: ConfirmModalProps) {
  if (!isOpen || !user) return null;

  const config = {
    delete: {
      title: 'Supprimer le compte',
      msg: `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
      btnLabel: 'Supprimer',
      btnColor: '#CE1126',
      icon: <Icons.Trash />,
    },
    disable: {
      title: 'Désactiver le compte',
      msg: `Le compte de ${user.firstName} ${user.lastName} sera désactivé. L'utilisateur ne pourra plus se connecter.`,
      btnLabel: 'Désactiver',
      btnColor: '#D97706',
      icon: <Icons.Power />,
    },
    enable: {
      title: 'Réactiver le compte',
      msg: `Le compte de ${user.firstName} ${user.lastName} sera réactivé. L'utilisateur pourra à nouveau se connecter.`,
      btnLabel: 'Réactiver',
      btnColor: '#007A3D',
      icon: <Icons.Check />,
    },
    view: {
      title: 'Détails utilisateur',
      msg: '',
      btnLabel: 'Fermer',
      btnColor: '#0D2B55',
      icon: <Icons.Eye />,
    },
  };

  const c = config[type];
  const status = getStatus(user);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          maxWidth: type === 'view' ? 540 : 440,
          width: '90%',
          boxShadow: '0 24px 80px rgba(0,0,0,.25)',
          animation: 'cardReveal .25s cubic-bezier(.22,.68,0,1.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `${c.btnColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: c.btnColor,
            }}
          >
            {c.icon}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55' }}>
            {c.title}
          </h3>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', padding: 4 }}
          >
            <Icons.X />
          </button>
        </div>

        {type === 'view' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: 'rgba(13,43,85,.04)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ROLE_COLORS[user.role] ?? '#0D2B55'}cc, ${ROLE_COLORS[user.role] ?? '#0D2B55'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: '#0D2B55', fontSize: '.95rem' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p style={{ fontSize: '.78rem', color: '#8E9BAA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: STATUS_CONFIG[status].bg,
                  color: STATUS_CONFIG[status].color,
                  fontSize: '.72rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {STATUS_CONFIG[status].label}
              </span>
            </div>

            {[
              ['Matricule', user.matricule ?? '—'],
              ['N° CNI', user.cniNumber ?? '—'],
              ['Rôle', formatRole(user.role)],
              ['Section', getSection(user)],
              ['Téléphone', user.phoneNumber ?? '—'],
              ['2FA', user.mfaEnabled ? '✅ Activé' : '❌ Désactivé'],
              ['Première connexion', user.firstLogin ? 'Non encore connecté' : 'Déjà connecté'],
              ['Date de création', user.createdDate ? new Date(user.createdDate).toLocaleDateString('fr-FR') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E8ECF0' }}>
                <span style={{ fontSize: '.82rem', color: '#8E9BAA', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '.82rem', color: '#1A202C', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}

            {user.affectations && user.affectations.length > 0 && (
              <div style={{ padding: '7px 0' }}>
                <p style={{ fontSize: '.82rem', color: '#8E9BAA', fontWeight: 500, marginBottom: 6 }}>Programmes</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {user.affectations.map(a => (
                    <span
                      key={a.affectationId}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: 'rgba(13,43,85,.08)',
                        color: '#0D2B55',
                        fontSize: '.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {a.programmeLibelle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '.875rem', color: '#4A5568', lineHeight: 1.6 }}>{c.msg}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1.5px solid #E8ECF0',
              borderRadius: 8,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '.875rem',
              color: '#4A5568',
              fontWeight: 500,
            }}
          >
            {type === 'view' ? 'Fermer' : 'Annuler'}
          </button>
          {type !== 'view' && (
            <button
              onClick={onConfirm}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                background: c.btnColor,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '.875rem',
                color: '#fff',
                fontWeight: 600,
                boxShadow: `0 4px 12px ${c.btnColor}40`,
              }}
            >
              {c.btnLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type AdminNav = 'dashboard' | 'utilisateurs' | 'statistiques' | 'parametres';

function navFromPath(pathname: string | null): AdminNav {
  if (!pathname) return 'dashboard';
  if (pathname.includes('/admin/dashboard/utilisateur')) return 'utilisateurs';
  return 'dashboard';
}

export default function AdminDashboard({ initialNav }: { initialNav?: AdminNav }) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeNav, setActiveNav] = useState<AdminNav>(initialNav ?? navFromPath(pathname));

  useEffect(() => {
    setActiveNav(initialNav ?? navFromPath(pathname));
  }, [pathname, initialNav]);

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterRole, setFilterRole] = useState<string>('tous');

  const [modal, setModal] = useState<{ type: ConfirmModalProps['type']; user: BackendUser | null }>({ type: 'view', user: null });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const userContext = getUserContext();

  useEffect(() => {
    if (!userContext) return;
    const activeAffectation = userContext.affectations?.find(a => a.actif) ?? userContext.affectations?.[0];
    const roleSysteme = activeAffectation?.roleSysteme;
    if (roleSysteme && roleSysteme !== 'ADMIN') {
      router.replace(APP_ROUTES.DASHBOARD);
    }
  }, [router, userContext]);

  const fetchUsers = useCallback(async () => {
    if (hasLoaded) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const token = getAccessToken();
      if (!token) {
        router.replace(APP_ROUTES.LOGIN);
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.USERS, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        clearTokens();
        router.replace(APP_ROUTES.LOGIN);
        return;
      }

      if (response.status === 403) {
        setLoadError("Accès refusé. Vous n'avez pas les droits d'administrateur.");
        return;
      }

      if (!response.ok) {
        setLoadError(`Erreur ${response.status} lors du chargement des utilisateurs.`);
        return;
      }

      const data: BackendUser[] = await response.json();
      setUsers(data);
      setHasLoaded(true);
    } catch {
      setLoadError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  }, [hasLoaded, router]);

  useEffect(() => {
    if (activeNav === 'utilisateurs') {
      fetchUsers();
    }
  }, [activeNav, fetchUsers]);

  const stats = useMemo(
    () => ({
      total: users.length,
      actifs: users.filter(u => u.enabled && !u.firstLogin).length,
      inactifs: users.filter(u => !u.enabled).length,
      en_attente: users.filter(u => u.firstLogin).length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch =
        !q ||
        [u.firstName, u.lastName, u.email, u.matricule ?? '', getSection(u), formatRole(u.role)].some(field =>
          field.toLowerCase().includes(q),
        );
      const status = getStatus(u);
      const matchStatus = filterStatus === 'tous' || status === filterStatus;
      const matchRole = filterRole === 'tous' || u.role === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, filterStatus, filterRole]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (type: ConfirmModalProps['type'], user: BackendUser) => {
    setModal({ type, user });
  };

  const handleConfirm = () => {
    const user = modal.user;
    if (!user) return;

    if (modal.type === 'delete') {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été supprimé.`);
    } else if (modal.type === 'disable') {
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, enabled: false, firstLogin: false } : u)));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été désactivé.`);
    } else if (modal.type === 'enable') {
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, enabled: true } : u)));
      showToast(`Le compte de ${user.firstName} ${user.lastName} a été réactivé.`);
    }

    setModal({ type: 'view', user: null });
  };

  const handleLogout = () => {
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  function actionBtn(color: string, bg: string): React.CSSProperties {
    return {
      width: 30,
      height: 30,
      border: `1px solid ${color}30`,
      borderRadius: 6,
      background: bg,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
      transition: 'all .15s ease',
    };
  }

  const navItems = [
    { id: 'dashboard' as const, label: "Vue d'ensemble", icon: <Icons.Dashboard />, href: '/admin/dashboard' },
    { id: 'utilisateurs' as const, label: 'Utilisateurs', icon: <Icons.Users />, href: '/admin/dashboard/utilisateur' },
    { id: 'statistiques' as const, label: 'Statistiques', icon: <Icons.Chart />, href: '/admin/dashboard' },
    { id: 'parametres' as const, label: 'Paramètres', icon: <Icons.Settings />, href: '/admin/dashboard' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
      <aside
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          zIndex: 50,
        }}
      >
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

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p
            style={{
              fontSize: '.65rem',
              color: 'rgba(255,255,255,.3)',
              fontWeight: 600,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              padding: '6px 8px',
              marginBottom: 4,
            }}
          >
            Navigation
          </p>

          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                router.push(item.href);
              }}
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
                background: activeNav === item.id ? 'rgba(255,255,255,.12)' : 'transparent',
                transition: 'all .15s ease',
                textAlign: 'left',
              }}
            >
              <span style={{ opacity: activeNav === item.id ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {item.id === 'utilisateurs' && hasLoaded && users.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#FCD116', color: '#0D2B55', borderRadius: 999, fontSize: '.65rem', fontWeight: 700, padding: '2px 7px' }}>
                  {users.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #CE1126, #8B0914)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
              {userContext ? `${userContext.firstName[0]}${userContext.lastName[0]}` : 'AD'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userContext ? `${userContext.firstName} ${userContext.lastName}` : 'Administrateur'}
              </p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)' }}>Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8,
              background: 'rgba(255,255,255,.06)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '.82rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,.6)',
            }}
          >
            <Icons.Logout /> Déconnexion
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126' }} />
          <div style={{ background: '#FCD116' }} />
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
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
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
              {activeNav === 'dashboard' ? "Vue d'ensemble" : activeNav === 'utilisateurs' ? 'Gestion des utilisateurs' : activeNav === 'statistiques' ? 'Statistiques' : 'Paramètres'}
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                position: 'relative',
                width: 38,
                height: 38,
                border: '1px solid #E8ECF0',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A5568',
              }}
            >
              <Icons.Bell />
              {stats.en_attente > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#CE1126', borderRadius: '50%', border: '1.5px solid #fff' }} />}
            </button>

            <Link href={APP_ROUTES.REGISTER}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
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
                }}
              >
                <Icons.Plus /> Ajouter un utilisateur
              </button>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {activeNav === 'dashboard' && (
            <div style={{ animation: 'fadeSlideDown .3s ease' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)',
                  borderRadius: 14,
                  padding: '28px 32px',
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(13,43,85,.20)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
                <div style={{ position: 'absolute', right: 60, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(252,209,22,.06)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div style={{ background: '#007A3D' }} />
                  <div style={{ background: '#CE1126' }} />
                  <div style={{ background: '#FCD116' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ color: '#FCD116', fontSize: '.75rem', fontWeight: 500, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>Tableau de bord administrateur</p>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    Bienvenue, {userContext?.firstName ?? 'Administrateur'} 👋
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem' }}>Gérez les utilisateurs et les accès à la plateforme GBE-MINFI</p>
                </div>
                <Image src="/images/logo-minfi.png" alt="MINFI" width={70} height={70} style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', position: 'relative', zIndex: 1, opacity: 0.9 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
                {[
                  { label: 'Total utilisateurs', value: stats.total, color: '#0D2B55', bg: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', icon: '👥', note: hasLoaded ? `${users.length} en BD` : 'Cliquez sur Utilisateurs' },
                  { label: 'Comptes actifs', value: stats.actifs, color: '#007A3D', bg: 'linear-gradient(135deg, #005A2D, #009A4E)', icon: '✅', note: hasLoaded ? `${stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0}% du total` : '—' },
                  { label: 'Comptes inactifs', value: stats.inactifs, color: '#CE1126', bg: 'linear-gradient(135deg, #8B0914, #CE1126)', icon: '⛔', note: 'Accès révoqué' },
                  { label: 'En attente', value: stats.en_attente, color: '#D97706', bg: 'linear-gradient(135deg, #92400E, #F59E0B)', icon: '⏳', note: 'Jamais connecté' },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      padding: '20px 22px',
                      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                      border: '1px solid #E8ECF0',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: `cardReveal .4s ${i * 0.07}s cubic-bezier(.22,.68,0,1.2) both`,
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.bg }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '.75rem', color: '#8E9BAA', fontWeight: 500, marginBottom: 6 }}>{kpi.label}</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                        <p style={{ fontSize: '.7rem', color: '#8E9BAA', marginTop: 6 }}>{kpi.note}</p>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${kpi.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{kpi.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55', marginBottom: 16 }}>Accès rapide</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { icon: '👥', label: 'Gérer les utilisateurs', action: () => router.push('/admin/dashboard/utilisateur'), color: '#0D2B55', bg: 'rgba(13,43,85,.06)' },
                    { icon: '➕', label: 'Ajouter un utilisateur', action: () => router.push(APP_ROUTES.REGISTER), color: '#007A3D', bg: 'rgba(0,122,61,.06)' },
                    { icon: '📊', label: 'Voir les statistiques', action: () => router.push('/admin/dashboard'), color: '#7C3AED', bg: 'rgba(124,58,237,.06)' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 10, border: `1px solid ${item.color}20`, background: item.bg, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'all .15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '.85rem', fontWeight: 600, color: item.color }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeNav === 'utilisateurs' && (
            <div style={{ animation: 'fadeSlideDown .3s ease' }}>
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 16 }}>
                  <div style={{ width: 44, height: 44, border: '3px solid #E8ECF0', borderTopColor: '#0D2B55', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  <p style={{ color: '#8E9BAA', fontSize: '.875rem' }}>Chargement des utilisateurs…</p>
                </div>
              )}

              {!isLoading && loadError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Erreur de chargement</p>
                    <p style={{ fontSize: '.85rem', color: '#991B1B' }}>{loadError}</p>
                  </div>
                  <button
                    onClick={() => {
                      setHasLoaded(false);
                      fetchUsers();
                    }}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#CE1126', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600 }}
                  >
                    <Icons.Refresh /> Réessayer
                  </button>
                </div>
              )}

              {!isLoading && !loadError && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>Tous les utilisateurs</h2>
                      <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 }}>
                        {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {users.length}
                      </p>
                    </div>

                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8E9BAA' }}>
                        <Icons.Search />
                      </span>
                      <input
                        type="text"
                        placeholder="Rechercher par nom, email, matricule, section…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', height: 38, border: '1.5px solid #E8ECF0', borderRadius: 8, paddingLeft: 36, paddingRight: 12, fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#1A202C', outline: 'none', background: '#F5F6FA' }}
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      style={{ height: 38, padding: '0 12px', border: '1.5px solid #E8ECF0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568', background: '#F5F6FA', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="en_attente">En attente</option>
                    </select>

                    <select
                      value={filterRole}
                      onChange={e => setFilterRole(e.target.value)}
                      style={{ height: 38, padding: '0 12px', border: '1.5px solid #E8ECF0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568', background: '#F5F6FA', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="tous">Tous les rôles</option>
                      <option value="ADMIN">Administrateur</option>
                      <option value="ORDONNATEUR_PRINCIPAL">Ordonnateur Principal</option>
                      <option value="ORDONNATEUR_SECONDAIRE">Ordonnateur Secondaire</option>
                      <option value="ORDONNATEUR_DELEGUE">Ordonnateur Délégué</option>
                      <option value="CONTROLEUR_FINANCIER">Contrôleur Financier</option>
                      <option value="COMPTABLE">Comptable</option>
                    </select>

                    <button
                      onClick={() => {
                        setHasLoaded(false);
                        fetchUsers();
                      }}
                      title="Rafraîchir la liste"
                      style={{ width: 38, height: 38, border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#F5F6FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5568' }}
                    >
                      <Icons.Refresh />
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8F9FB' }}>
                          {['Utilisateur', 'Matricule', 'Rôle', 'Section', 'Statut', 'Date création', 'Actions'].map(col => (
                            <th
                              key={col}
                              style={{ padding: '11px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, color: '#8E9BAA', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #E8ECF0' }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#8E9BAA', fontSize: '.875rem' }}>
                              {users.length === 0 ? 'Aucun utilisateur trouvé dans la base de données.' : `Aucun résultat pour « ${search || filterStatus !== 'tous' ? 'ces filtres' : filterRole} »`}
                            </td>
                          </tr>
                        ) : (
                          filtered.map((user, i) => {
                            const status = getStatus(user);
                            return (
                              <tr
                                key={user.id}
                                style={{ borderBottom: '1px solid #F0F2F5', transition: 'background .12s ease', animation: `fadeSlideDown .3s ${i * 0.04}s ease both` }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                      style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${ROLE_COLORS[user.role] ?? '#0D2B55'}cc, ${ROLE_COLORS[user.role] ?? '#0D2B55'})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '.78rem',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {user.firstName[0]}
                                      {user.lastName[0]}
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#1A202C' }}>
                                        {user.firstName} {user.lastName}
                                      </p>
                                      <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>{user.email}</p>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#4A5568', background: '#F0F2F5', padding: '3px 8px', borderRadius: 4 }}>{user.matricule ?? '—'}</span>
                                </td>

                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: ROLE_COLORS[user.role] ?? '#0D2B55', background: `${ROLE_COLORS[user.role] ?? '#0D2B55'}12`, padding: '3px 10px', borderRadius: 999 }}>
                                    {formatRole(user.role)}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                  <p style={{ fontSize: '.78rem', color: '#4A5568', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSection(user)}</p>
                                </td>

                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_CONFIG[status].dot, flexShrink: 0 }} />
                                    <span style={{ fontSize: '.75rem', fontWeight: 600, color: STATUS_CONFIG[status].color, background: STATUS_CONFIG[status].bg, padding: '3px 10px', borderRadius: 999 }}>
                                      {STATUS_CONFIG[status].label}
                                    </span>
                                  </div>
                                </td>

                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                  <p style={{ fontSize: '.78rem', color: '#8E9BAA' }}>{user.createdDate ? new Date(user.createdDate).toLocaleDateString('fr-FR') : '—'}</p>
                                </td>

                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button title="Voir les détails" onClick={() => handleAction('view', user)} style={actionBtn('#4A5568', '#F0F2F5')}>
                                      <Icons.Eye />
                                    </button>
                                    <Link href={`/admin/users/edit/${user.id}`}>
                                      <button title="Modifier" style={actionBtn('#007A3D', '#F0FDF4')}>
                                        <Icons.Edit />
                                      </button>
                                    </Link>
                                    {user.enabled ? (
                                      <button title="Désactiver le compte" onClick={() => handleAction('disable', user)} style={actionBtn('#D97706', '#FFFBEB')}>
                                        <Icons.Power />
                                      </button>
                                    ) : (
                                      <button title="Réactiver le compte" onClick={() => handleAction('enable', user)} style={actionBtn('#007A3D', '#F0FDF4')}>
                                        <Icons.Check />
                                      </button>
                                    )}
                                    <button title="Supprimer" onClick={() => handleAction('delete', user)} style={actionBtn('#CE1126', '#FEF2F2')}>
                                      <Icons.Trash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filtered.length > 0 && (
                    <div style={{ padding: '12px 24px', borderTop: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '.78rem', color: '#8E9BAA' }}>
                        Affichage de <strong style={{ color: '#4A5568' }}>{filtered.length}</strong> utilisateur{filtered.length > 1 ? 's' : ''}
                        {(filterStatus !== 'tous' || filterRole !== 'tous' || search) && (
                          <button onClick={() => { setSearch(''); setFilterStatus('tous'); setFilterRole('tous'); }} style={{ marginLeft: 8, color: '#0D2B55', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.78rem' }}>
                            Réinitialiser les filtres
                          </button>
                        )}
                      </p>
                      <p style={{ fontSize: '.72rem', color: '#8E9BAA' }}>Données au {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ConfirmModal isOpen={modal.user !== null} type={modal.type} user={modal.user} onClose={() => setModal({ type: 'view', user: null })} onConfirm={handleConfirm} />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#0D2B55' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s cubic-bezier(.22,.68,0,1.2)', maxWidth: 360 }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

