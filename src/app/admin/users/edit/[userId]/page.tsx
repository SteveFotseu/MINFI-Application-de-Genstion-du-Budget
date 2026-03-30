'use client';

// ============================================================
// FICHIER  : src/app/admin/users/edit/[userId]/page.tsx
// RÔLE     : Page de modification d'un utilisateur par l'admin.
//
// FONCTIONNALITÉS :
//   1. Affichage des infos de base de l'utilisateur (lecture seule)
//   2. Gestion des affectations existantes :
//      - Visualisation de toutes ses affectations
//      - Modification du rôle sur une affectation existante
//   3. Ajout d'une nouvelle affectation :
//      - Cascade : Exercice → Section → Programme
//      - Choix du rôle pour chaque programme sélectionné
//      - Soumission = un POST par programme sélectionné
//
// ARCHITECTURE DES ROUTES PROXY UTILISÉES :
//   GET  /api/admin/users/{userId}
//   GET  /api/admin/users/{userId}/affectations
//   POST /api/admin/users/{userId}/affectations        { programmeId, roleSysteme }
//   PATCH /api/admin/users/{userId}/affectations/{affectationId}/role { roleSysteme }
//
// HIÉRARCHIE RÉFÉRENTIEL :
//   Exercice → Section → Programme → Action
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getAccessToken,
  clearTokens,
  getUserContext,
} from '@/lib/authService';
import {
  APP_ROUTES,
  REFERENTIEL_ENDPOINTS,
} from '@/constants/auth';
import type { SelectOption } from '@/components/ui/SearchableSelect';
import SearchableSelect from '@/components/ui/SearchableSelect';

// ─────────────────────────────────────────────────────────────
// TYPES LOCAUX
// ─────────────────────────────────────────────────────────────

/** Affectation telle que retournée par le back-end */
interface Affectation {
  affectationId: string;
  roleSysteme: string;
  sectionId: string;
  sectionLibelle: string;
  programmeId: string;
  programmeLibelle: string;
  actif: boolean;
}

/** Infos minimales de l'utilisateur affiché en en-tête */
interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  matricule: string | null;
  enabled: boolean;
}

/**
 * Entrée dans le formulaire d'ajout d'affectation.
 * Un ProgrammeEntry = un programme sélectionné + son rôle choisi.
 */
interface ProgrammeEntry {
  /** ID du programme */
  programmeId: string;
  /** Libellé pour l'affichage */
  programmeLibelle: string;
  /** Rôle choisi pour ce programme */
  roleSysteme: string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────

/** Liste des rôles disponibles dans le système */
const ROLES_SYSTEME: SelectOption[] = [
  { id: 'ADMIN',                   label: 'Administrateur' },
  { id: 'ORDONNATEUR_PRINCIPAL',   label: 'Ordonnateur Principal' },
  { id: 'ORDONNATEUR_SECONDAIRE',  label: 'Ordonnateur Secondaire' },
  { id: 'ORDONNATEUR_DELEGUE',     label: 'Ordonnateur Délégué' },
  { id: 'CONTROLEUR_FINANCIER',    label: 'Contrôleur Financier' },
  { id: 'COMPTABLE',               label: 'Comptable' },
];

/** Couleurs visuelles par rôle système */
const ROLE_COLORS: Record<string, string> = {
  ADMIN:                   '#CE1126',
  ORDONNATEUR_PRINCIPAL:   '#0D2B55',
  ORDONNATEUR_SECONDAIRE:  '#1A3A6B',
  ORDONNATEUR_DELEGUE:     '#2451A0',
  CONTROLEUR_FINANCIER:    '#007A3D',
  COMPTABLE:               '#7C3AED',
};

/** Libellés lisibles par rôle système */
const ROLE_LABELS: Record<string, string> = {
  ADMIN:                   'Administrateur',
  ORDONNATEUR_PRINCIPAL:   'Ordonnateur Principal',
  ORDONNATEUR_SECONDAIRE:  'Ordonnateur Secondaire',
  ORDONNATEUR_DELEGUE:     'Ordonnateur Délégué',
  CONTROLEUR_FINANCIER:    'Contrôleur Financier',
  COMPTABLE:               'Comptable',
};

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG INLINE
// ─────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,11 16,11" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 11" />
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
  </svg>
);
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IconRole = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/** Spinner inline réutilisable */
const Spinner = ({ size = 16 }: { size?: number }) => (
  <span style={{
    display: 'inline-block',
    width: size, height: size,
    border: '2px solid rgba(0,0,0,.1)',
    borderTopColor: '#0D2B55',
    borderRadius: '50%',
    animation: 'spin .65s linear infinite',
    flexShrink: 0,
  }} />
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT : MODAL DE MODIFICATION DE RÔLE
// Permet à l'admin de changer le rôle d'une affectation existante
// ─────────────────────────────────────────────────────────────
interface EditRoleModalProps {
  isOpen: boolean;
  affectation: Affectation | null;
  userId: string;
  onClose: () => void;
  /** Appelé avec l'affectation mise à jour après succès */
  onSuccess: (updated: Affectation) => void;
}

function EditRoleModal({ isOpen, affectation, userId, onClose, onSuccess }: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');

  // Pré-remplir avec le rôle actuel de l'affectation
  useEffect(() => {
    if (affectation) {
      setSelectedRole(affectation.roleSysteme);
      setError('');
    }
  }, [affectation]);

  if (!isOpen || !affectation) return null;

  const handleSubmit = async () => {
    if (!selectedRole) { setError('Veuillez sélectionner un rôle.'); return; }
    if (selectedRole === affectation.roleSysteme) { onClose(); return; }

    setIsLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      if (!token) return;

      // PATCH /api/admin/users/{userId}/affectations/{affectationId}/role
      const res = await fetch(
        `/api/admin/users/${userId}/affectations/${affectation.affectationId}/role`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ roleSysteme: selectedRole }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erreur ${res.status}`);
      }

      const updated: Affectation = await res.json();
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Overlay semi-transparent avec fermeture au clic extérieur
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        maxWidth: 460, width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,.25)',
        animation: 'cardReveal .25s cubic-bezier(.22,.68,0,1.2)',
      }}>
        {/* En-tête de la modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,122,61,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007A3D' }}>
              <IconEdit />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' }}>
              Modifier le rôle
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', padding: 4 }}>
            <IconX />
          </button>
        </div>

        {/* Résumé de l'affectation concernée */}
        <div style={{ padding: '12px 14px', background: '#F8F9FB', borderRadius: 10, marginBottom: 18, border: '1px solid #E8ECF0' }}>
          <p style={{ fontSize: '.78rem', color: '#8E9BAA', marginBottom: 4 }}>Programme</p>
          <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#0D2B55' }}>{affectation.programmeLibelle}</p>
          <p style={{ fontSize: '.75rem', color: '#8E9BAA', marginTop: 4 }}>Section : {affectation.sectionLibelle}</p>
        </div>

        {/* Sélecteur de rôle */}
        <div style={{ marginBottom: 16 }}>
          <SearchableSelect
            id="editRole"
            label="Nouveau rôle *"
            placeholder="Sélectionnez un rôle…"
            options={ROLES_SYSTEME}
            multiple={false}
            value={selectedRole}
            onChange={setSelectedRole}
            icon={<IconRole />}
          />
        </div>

        {/* Message d'erreur éventuel */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '.82rem', marginBottom: 14 }}>
            <IconAlert /> {error}
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568', fontWeight: 500 }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedRole}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', border: 'none', borderRadius: 8,
              background: isLoading ? '#8E9BAA' : 'linear-gradient(135deg, #007A3D, #005A2D)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(0,122,61,.3)',
            }}
          >
            {isLoading ? <><Spinner size={14} /> Modification…</> : <><IconCheck /> Confirmer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : PAGE D'ÉDITION
// ─────────────────────────────────────────────────────────────
export default function EditUserPage() {
  const router  = useRouter();
  const params  = useParams();
  const userId  = params.userId as string;

  // ── État : données utilisateur ──
  const [user,        setUser]        = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError,   setUserError]   = useState('');

  // ── État : affectations existantes ──
  const [affectations,        setAffectations]        = useState<Affectation[]>([]);
  const [loadingAffectations, setLoadingAffectations] = useState(true);
  const [affectationsError,   setAffectationsError]   = useState('');

  // ── État : formulaire d'ajout d'affectation ──
  const [exerciceId,    setExerciceId]    = useState('');
  const [sectionId,     setSectionId]     = useState('');
  const [programmeIds,  setProgrammeIds]  = useState<string[]>([]);
  /**
   * Map programmeId → roleSysteme choisi pour chaque programme sélectionné.
   * Permet de gérer le rôle par programme indépendamment.
   */
  const [programmeRoles, setProgrammeRoles] = useState<Record<string, string>>({});

  // ── État : données de référence (cascade) ──
  const [exercices,      setExercices]      = useState<SelectOption[]>([]);
  const [sections,       setSections]       = useState<SelectOption[]>([]);
  const [programmes,     setProgrammes]     = useState<SelectOption[]>([]);
  const [loadExercices,  setLoadExercices]  = useState(false);
  const [loadSections,   setLoadSections]   = useState(false);
  const [loadProgrammes, setLoadProgrammes] = useState(false);

  // ── État : soumission du formulaire d'ajout ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [submitSuccess,setSubmitSuccess]= useState('');

  // ── État : modal de modification de rôle ──
  const [editModal, setEditModal] = useState<{ open: boolean; affectation: Affectation | null }>({
    open: false, affectation: null,
  });

  // ── Toast de notification ──
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ─────────────────────────────────────────────────────────────
  // UTILITAIRE : affichage d'un toast temporaire
  // ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // UTILITAIRE : headers HTTP communs
  // ─────────────────────────────────────────────────────────────
  const authHeaders = useCallback((): HeadersInit | null => {
    const token = getAccessToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CHARGEMENT : infos de l'utilisateur via GET /api/admin/users/{userId}
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }

    // Vérification que l'utilisateur connecté est bien ADMIN
    const ctx = getUserContext();
    const activeRole = (ctx?.affectations?.find(a => a.actif) ?? ctx?.affectations?.[0])?.roleSysteme;
    if (activeRole && activeRole !== 'ADMIN') {
      router.replace(APP_ROUTES.DASHBOARD);
      return;
    }

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setUserError(err instanceof Error ? err.message : 'Impossible de charger l\'utilisateur.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  // ─────────────────────────────────────────────────────────────
  // CHARGEMENT : affectations via GET /api/admin/users/{userId}/affectations
  // ─────────────────────────────────────────────────────────────
  const fetchAffectations = useCallback(async () => {
    setLoadingAffectations(true);
    setAffectationsError('');
    try {
      const headers = authHeaders();
      if (!headers) return;

      const res = await fetch(`/api/admin/users/${userId}/affectations`, {
        headers,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Affectation[] = await res.json();
      setAffectations(Array.isArray(data) ? data : []);
    } catch (err) {
      setAffectationsError(err instanceof Error ? err.message : 'Impossible de charger les affectations.');
    } finally {
      setLoadingAffectations(false);
    }
  }, [userId, authHeaders]);

  useEffect(() => { fetchAffectations(); }, [fetchAffectations]);

  // ─────────────────────────────────────────────────────────────
  // CHARGEMENT INITIAL : exercices budgétaires
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    setLoadExercices(true);
    fetch(REFERENTIEL_ENDPOINTS.EXERCICES, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.json())
      .then((data: any[]) => {
        setExercices(
          (data ?? [])
            .filter(x => x?.id != null)
            .map(x => ({
              id: String(x.id),
              label: [
                x.annee != null ? String(x.annee) : '',
                String(x.libelleFr ?? x.libelleEn ?? '').trim(),
              ].filter(Boolean).join(' - ') || String(x.id),
              code: x.codeExercice != null ? String(x.codeExercice) : undefined,
            })),
        );
      })
      .catch(() => setExercices([]))
      .finally(() => setLoadExercices(false));
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CASCADE : sections selon l'exercice sélectionné
  // ─────────────────────────────────────────────────────────────
  const fetchSectionsByExercice = useCallback(async (exId: string) => {
    if (!exId) { setSections([]); return; }
    const token = getAccessToken();
    if (!token) return;

    setLoadSections(true);
    try {
      const res = await fetch(REFERENTIEL_ENDPOINTS.SECTIONS_BY_EXERCICE(exId), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data: any[] = await res.json();
      setSections(
        (data ?? []).filter(s => s?.id != null).map(s => ({
          id: String(s.id),
          label: String(s.libelleFr ?? s.libelleEn ?? s.libelle ?? s.sigle ?? s.id),
          code: s.codeSection != null ? String(s.codeSection) : undefined,
        })),
      );
    } catch {
      setSections([]);
    } finally {
      setLoadSections(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CASCADE : programmes selon la section sélectionnée
  // ─────────────────────────────────────────────────────────────
  const fetchProgrammesBySection = useCallback(async (secId: string) => {
    if (!secId) { setProgrammes([]); return; }
    const token = getAccessToken();
    if (!token) return;

    setLoadProgrammes(true);
    // Réinitialiser la sélection des programmes en aval
    setProgrammeIds([]);
    setProgrammeRoles({});
    try {
      const res = await fetch(REFERENTIEL_ENDPOINTS.PROGRAMMES_BY_SECTION(secId), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data: any[] = await res.json();
      setProgrammes(
        (data ?? []).filter(p => p?.id != null).map(p => ({
          id: String(p.id),
          label: String(p.libelleFr ?? p.libelleEn ?? p.libelle ?? p.id),
          code: p.codeProgramme != null ? String(p.codeProgramme) : undefined,
        })),
      );
    } catch {
      setProgrammes([]);
    } finally {
      setLoadProgrammes(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS CASCADE
  // ─────────────────────────────────────────────────────────────

  /** Quand l'exercice change → recharger les sections */
  const handleExerciceChange = (id: string) => {
    setExerciceId(id);
    setSectionId('');
    setSections([]);
    setProgrammes([]);
    setProgrammeIds([]);
    setProgrammeRoles({});
    fetchSectionsByExercice(id);
    setSubmitError('');
  };

  /** Quand la section change → recharger les programmes */
  const handleSectionChange = (id: string) => {
    setSectionId(id);
    setProgrammes([]);
    setProgrammeIds([]);
    setProgrammeRoles({});
    fetchProgrammesBySection(id);
    setSubmitError('');
  };

  /**
   * Quand les programmes sélectionnés changent :
   * - Conserver les rôles déjà saisis pour les programmes maintenus
   * - Supprimer les rôles des programmes désélectionnés
   */
  const handleProgrammeIdsChange = (ids: string[]) => {
    setProgrammeIds(ids);
    setProgrammeRoles(prev => {
      const next: Record<string, string> = {};
      ids.forEach(id => { next[id] = prev[id] ?? ''; });
      return next;
    });
    setSubmitError('');
  };

  /** Mise à jour du rôle d'un programme spécifique dans le formulaire */
  const handleProgrammeRoleChange = (programmeId: string, role: string) => {
    setProgrammeRoles(prev => ({ ...prev, [programmeId]: role }));
    setSubmitError('');
  };

  // ─────────────────────────────────────────────────────────────
  // SOUMISSION : ajout d'affectations
  // Pour chaque programme sélectionné, on envoie un POST distinct.
  // POST /api/admin/users/{userId}/affectations
  //   { programmeId, roleSysteme }
  // ─────────────────────────────────────────────────────────────
  const handleSubmitAffectations = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    // ── Validation du formulaire ──
    if (!exerciceId) { setSubmitError('Veuillez sélectionner un exercice.'); return; }
    if (!sectionId)  { setSubmitError('Veuillez sélectionner une section.'); return; }
    if (programmeIds.length === 0) { setSubmitError('Veuillez sélectionner au moins un programme.'); return; }

    // Vérifier que chaque programme a un rôle assigné
    const missingRole = programmeIds.find(id => !programmeRoles[id]);
    if (missingRole) {
      const prog = programmes.find(p => p.id === missingRole);
      setSubmitError(`Veuillez choisir un rôle pour le programme "${prog?.label ?? missingRole}".`);
      return;
    }

    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }

    setIsSubmitting(true);

    try {
      // Envoi d'un POST pour chaque programme sélectionné
      const results = await Promise.allSettled(
        programmeIds.map(programmeId =>
          fetch(`/api/admin/users/${userId}/affectations`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              programmeId,
              roleSysteme: programmeRoles[programmeId],
            }),
          }).then(async res => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.message ?? `Erreur ${res.status}`);
            }
            return res.json() as Promise<Affectation>;
          }),
        ),
      );

      // Analyse des résultats : succès et échecs
      const succeeded = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<Affectation>[];
      const failed    = results.filter(r => r.status === 'rejected')  as PromiseRejectedResult[];

      if (succeeded.length > 0) {
        // Ajouter les nouvelles affectations à la liste locale
        setAffectations(prev => [...prev, ...succeeded.map(r => r.value)]);
      }

      if (failed.length > 0) {
        const messages = failed.map(r => r.reason?.message ?? 'Erreur inconnue').join(', ');
        setSubmitError(`${failed.length} affectation(s) ont échoué : ${messages}`);
      } else {
        // Tout s'est bien passé : reset du formulaire
        setSubmitSuccess(
          `${succeeded.length} affectation(s) ajoutée(s) avec succès.`,
        );
        setExerciceId('');
        setSectionId('');
        setProgrammeIds([]);
        setProgrammeRoles({});
        setSections([]);
        setProgrammes([]);
        showToast(`${succeeded.length} affectation(s) ajoutée(s) avec succès.`);
      }
    } catch {
      setSubmitError('Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLER : succès de modification de rôle
  // ─────────────────────────────────────────────────────────────
  const handleRoleUpdated = (updated: Affectation) => {
    // Mettre à jour l'affectation dans la liste locale sans rechargement
    setAffectations(prev =>
      prev.map(a => a.affectationId === updated.affectationId ? updated : a),
    );
    showToast(`Rôle modifié avec succès sur "${updated.programmeLibelle}".`);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU : état de chargement global
  // ─────────────────────────────────────────────────────────────
  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center', color: '#8E9BAA' }}>
          <Spinner size={44} />
          <p style={{ marginTop: 16 }}>Chargement de l'utilisateur…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDU : erreur de chargement de l'utilisateur
  // ─────────────────────────────────────────────────────────────
  if (userError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '24px 32px', textAlign: 'center', maxWidth: 420 }}>
          <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: 8 }}>Erreur de chargement</p>
          <p style={{ fontSize: '.875rem', color: '#991B1B', marginBottom: 16 }}>{userError}</p>
          <button
            onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)}
            style={{ padding: '10px 20px', background: '#0D2B55', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Initialisation du nom d'affichage
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
  const roleColor = ROLE_COLORS[user?.role ?? ''] ?? '#0D2B55';

  // ─────────────────────────────────────────────────────────────
  // RENDU PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ════════════════════════════════════════
          SIDEBAR (identique à AdminDashboard)
          ════════════════════════════════════════ */}
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        flexShrink: 0, zIndex: 50,
      }}>
        {/* Logo */}
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

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px', marginBottom: 4 }}>
            Navigation
          </p>
          {[
            { label: "Vue d'ensemble", href: APP_ROUTES.ADMIN_DASHBOARD },
            { label: 'Utilisateurs',   href: '/admin/dashboard/utilisateur' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: '.85rem', fontWeight: 400,
                color: 'rgba(255,255,255,.55)', background: 'transparent',
                width: '100%', textAlign: 'left',
              }}>
                <IconUser /> {item.label}
              </button>
            </Link>
          ))}
        </nav>

        {/* Déconnexion */}
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

        {/* Bandes tricolores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126' }} />
          <div style={{ background: '#FCD116' }} />
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CONTENU PRINCIPAL
          ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Topbar ── */}
        <header style={{
          background: '#fff', padding: '0 32px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Bouton retour */}
            <button
              onClick={() => router.push('/admin/dashboard/utilisateur')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', border: '1.5px solid #E8ECF0',
                borderRadius: 8, background: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '.82rem',
                fontWeight: 500, color: '#4A5568',
              }}
            >
              <IconArrowLeft /> Utilisateurs
            </button>
            <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
                Modifier un utilisateur
              </h1>
              <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
                Gestion des affectations et rôles
              </p>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>

          {/* ── Fil d'Ariane ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: '.78rem', color: '#8E9BAA' }}>
            <span onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)} style={{ cursor: 'pointer' }}>Tableau de bord</span>
            <span>›</span>
            <span onClick={() => router.push('/admin/dashboard/utilisateur')} style={{ cursor: 'pointer' }}>Utilisateurs</span>
            <span>›</span>
            <span style={{ color: '#0D2B55', fontWeight: 600 }}>{displayName}</span>
          </div>

          {/* ── Carte identité de l'utilisateur ── */}
          {user && (
            <div style={{
              background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)',
              borderRadius: 14, padding: '22px 28px', marginBottom: 28,
              display: 'flex', alignItems: 'center', gap: 20,
              boxShadow: '0 8px 24px rgba(13,43,85,.18)',
              position: 'relative', overflow: 'hidden',
              animation: 'cardReveal .4s cubic-bezier(.22,.68,0,1.2) both',
            }}>
              {/* Décors de fond */}
              <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
              {/* Bandes tricolores en bas */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div style={{ background: '#007A3D' }} />
                <div style={{ background: '#CE1126' }} />
                <div style={{ background: '#FCD116' }} />
              </div>

              {/* Avatar */}
              <div style={{
                width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.3rem', fontWeight: 700,
                border: '2px solid rgba(255,255,255,.25)',
                position: 'relative', zIndex: 1,
              }}>
                {userInitials}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                  {displayName}
                </p>
                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
                  {user.email}
                  {user.matricule ? ` • ${user.matricule}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#FCD116', fontSize: '.75rem', fontWeight: 600 }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                  <span style={{ padding: '3px 12px', borderRadius: 999, background: user.enabled ? 'rgba(0,122,61,.25)' : 'rgba(206,17,38,.25)', color: user.enabled ? '#86EFAC' : '#FCA5A5', fontSize: '.75rem', fontWeight: 600 }}>
                    {user.enabled ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* ════════════════════════════════════════
                COLONNE GAUCHE : AFFECTATIONS EXISTANTES
                ════════════════════════════════════════ */}
            <div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>

                {/* En-tête section */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55' }}>
                      Affectations actuelles
                    </h2>
                    <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
                      {affectations.length} affectation(s) enregistrée(s)
                    </p>
                  </div>
                  {/* Bouton rafraîchir */}
                  <button
                    onClick={fetchAffectations}
                    title="Rafraîchir"
                    style={{
                      width: 32, height: 32, border: '1.5px solid #E8ECF0',
                      borderRadius: 7, background: '#F5F6FA', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#4A5568',
                    }}
                  >
                    <IconRefresh />
                  </button>
                </div>

                {/* État : chargement */}
                {loadingAffectations && (
                  <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#8E9BAA' }}>
                    <Spinner size={32} />
                    <p style={{ fontSize: '.82rem' }}>Chargement…</p>
                  </div>
                )}

                {/* État : erreur */}
                {!loadingAffectations && affectationsError && (
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10, background: '#FEF2F2', color: '#991B1B', fontSize: '.82rem' }}>
                    <IconAlert /> {affectationsError}
                  </div>
                )}

                {/* État : liste vide */}
                {!loadingAffectations && !affectationsError && affectations.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8E9BAA', fontSize: '.85rem' }}>
                    <p style={{ fontSize: '1.8rem', marginBottom: 10 }}>📋</p>
                    Aucune affectation pour cet utilisateur.<br />
                    <span style={{ fontSize: '.75rem' }}>Utilisez le formulaire ci-contre pour en ajouter.</span>
                  </div>
                )}

                {/* Liste des affectations */}
                {!loadingAffectations && !affectationsError && affectations.length > 0 && (
                  <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {affectations.map((aff, idx) => (
                      <div
                        key={aff.affectationId}
                        style={{
                          padding: '14px 20px',
                          borderBottom: idx < affectations.length - 1 ? '1px solid #F0F2F5' : 'none',
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          animation: `fadeSlideDown .3s ${idx * 0.04}s ease both`,
                        }}
                      >
                        {/* Indicateur actif/inactif */}
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: aff.actif ? '#22C55E' : '#EF4444', flexShrink: 0, marginTop: 5 }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Libellé du programme */}
                          <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#0D2B55', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {aff.programmeLibelle}
                          </p>
                          {/* Section parente */}
                          <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {aff.sectionLibelle}
                          </p>
                          {/* Badge de rôle */}
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px', borderRadius: 999, fontSize: '.7rem', fontWeight: 600,
                            color: ROLE_COLORS[aff.roleSysteme] ?? '#0D2B55',
                            background: `${ROLE_COLORS[aff.roleSysteme] ?? '#0D2B55'}15`,
                          }}>
                            {ROLE_LABELS[aff.roleSysteme] ?? aff.roleSysteme}
                          </span>
                        </div>

                        {/* Bouton modifier le rôle */}
                        <button
                          title="Modifier le rôle"
                          onClick={() => setEditModal({ open: true, affectation: aff })}
                          style={{
                            width: 30, height: 30, border: '1px solid #007A3D30',
                            borderRadius: 6, background: '#F0FDF4', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#007A3D', flexShrink: 0,
                          }}
                        >
                          <IconEdit />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════
                COLONNE DROITE : FORMULAIRE D'AJOUT
                ════════════════════════════════════════ */}
            <div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'visible' }}>

                {/* En-tête section */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8ECF0' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55' }}>
                    Ajouter des affectations
                  </h2>
                  <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
                    Sélectionnez l'exercice, la section et les programmes
                  </p>
                </div>

                <form onSubmit={handleSubmitAffectations} noValidate>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── Étape 1 : Exercice ── */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#0D2B55', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700 }}>1</div>
                        Exercice budgétaire *
                      </label>
                      {loadExercices ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                          <Spinner /> Chargement…
                        </div>
                      ) : (
                        <SearchableSelect
                          id="exercice"
                          label=""
                          placeholder="Sélectionnez un exercice…"
                          options={exercices}
                          multiple={false}
                          value={exerciceId}
                          onChange={handleExerciceChange}
                          icon={<IconCalendar />}
                        />
                      )}
                    </div>

                    {/* ── Étape 2 : Section (visible après exercice) ── */}
                    {exerciceId && (
                      <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#0D2B55', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700 }}>2</div>
                          Section administrative *
                        </label>
                        {loadSections ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                            <Spinner /> Chargement des sections…
                          </div>
                        ) : sections.length === 0 ? (
                          <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD116', borderRadius: 8, fontSize: '.78rem', color: '#92400E' }}>
                            ⚠️ Aucune section disponible pour cet exercice.
                          </div>
                        ) : (
                          <SearchableSelect
                            id="section"
                            label=""
                            placeholder="Sélectionnez une section…"
                            options={sections}
                            multiple={false}
                            value={sectionId}
                            onChange={handleSectionChange}
                            icon={<IconBuilding />}
                          />
                        )}
                      </div>
                    )}

                    {/* ── Étape 3 : Programmes (visible après section) ── */}
                    {sectionId && (
                      <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#0D2B55', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700 }}>3</div>
                          Programmes budgétaires *
                        </label>
                        {loadProgrammes ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                            <Spinner /> Chargement des programmes…
                          </div>
                        ) : programmes.length === 0 ? (
                          <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD116', borderRadius: 8, fontSize: '.78rem', color: '#92400E' }}>
                            ⚠️ Aucun programme disponible pour cette section.
                          </div>
                        ) : (
                          <SearchableSelect
                            id="programmes"
                            label=""
                            placeholder="Sélectionnez un ou plusieurs programmes…"
                            options={programmes}
                            multiple={true}
                            value={programmeIds}
                            onChange={handleProgrammeIdsChange}
                            icon={<IconGrid />}
                          />
                        )}
                      </div>
                    )}

                    {/* ── Étape 4 : Rôle par programme (un sélecteur par programme choisi) ── */}
                    {programmeIds.length > 0 && (
                      <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', fontWeight: 700, color: '#0D2B55', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#CE1126', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700 }}>4</div>
                          Rôle par programme *
                        </label>

                        {/* Un bloc par programme sélectionné */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {programmeIds.map(progId => {
                            const prog = programmes.find(p => p.id === progId);
                            const hasRole = !!programmeRoles[progId];
                            return (
                              <div
                                key={progId}
                                style={{
                                  padding: '12px 14px',
                                  background: hasRole ? '#F0FDF4' : '#F8F9FB',
                                  border: `1.5px solid ${hasRole ? '#BBF7D0' : '#E8ECF0'}`,
                                  borderRadius: 10,
                                  transition: 'border-color .2s, background .2s',
                                }}
                              >
                                {/* Nom du programme */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                  {/* Indicateur de complétion */}
                                  <div style={{
                                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                    background: hasRole ? '#007A3D' : '#E8ECF0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background .2s',
                                  }}>
                                    {hasRole && (
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                        <polyline points="20,6 9,17 4,12" />
                                      </svg>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '.82rem', fontWeight: 600, color: '#0D2B55', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {prog?.label ?? progId}
                                  </p>
                                  {/* Bouton retirer ce programme */}
                                  <button
                                    type="button"
                                    title="Retirer ce programme"
                                    onClick={() => handleProgrammeIdsChange(programmeIds.filter(id => id !== progId))}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', padding: 2, display: 'flex', alignItems: 'center' }}
                                  >
                                    <IconTrash />
                                  </button>
                                </div>

                                {/* Sélecteur de rôle pour ce programme */}
                                <SearchableSelect
                                  id={`role-${progId}`}
                                  label=""
                                  placeholder="Choisir un rôle…"
                                  options={ROLES_SYSTEME}
                                  multiple={false}
                                  value={programmeRoles[progId] ?? ''}
                                  onChange={(role) => handleProgrammeRoleChange(progId, role)}
                                  icon={<IconRole />}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Alertes feedback ── */}
                    {submitError && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '.82rem' }}>
                        <IconAlert /> <span>{submitError}</span>
                      </div>
                    )}
                    {submitSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, color: '#166534', fontSize: '.82rem' }}>
                        <IconCheck /> {submitSuccess}
                      </div>
                    )}

                    {/* ── Bouton de soumission ── */}
                    <button
                      type="submit"
                      disabled={isSubmitting || programmeIds.length === 0}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px',
                        border: 'none', borderRadius: 10,
                        background: (isSubmitting || programmeIds.length === 0)
                          ? '#8E9BAA'
                          : 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
                        cursor: (isSubmitting || programmeIds.length === 0) ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 600, color: '#fff',
                        boxShadow: (isSubmitting || programmeIds.length === 0) ? 'none' : '0 4px 14px rgba(13,43,85,.25)',
                        transition: 'all .15s',
                      }}
                    >
                      {isSubmitting ? (
                        <><Spinner size={16} /> Enregistrement…</>
                      ) : (
                        <><IconPlus /> Ajouter {programmeIds.length > 0 ? `${programmeIds.length} affectation(s)` : 'les affectations'}</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>{/* fin grid */}
        </main>
      </div>

      {/* ── Modal modification de rôle ── */}
      <EditRoleModal
        isOpen={editModal.open}
        affectation={editModal.affectation}
        userId={userId}
        onClose={() => setEditModal({ open: false, affectation: null })}
        onSuccess={handleRoleUpdated}
      />

      {/* ── Toast de notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#0D2B55' : '#CE1126',
          color: '#fff', fontSize: '.85rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          animation: 'fadeSlideDown .3s cubic-bezier(.22,.68,0,1.2)',
          maxWidth: 380,
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}