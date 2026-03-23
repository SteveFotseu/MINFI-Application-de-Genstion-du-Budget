'use client';

// ============================================================
// FICHIER  : src/app/admin/users/edit/[id]/page.tsx
//
// RÔLE     : Page de modification d'un utilisateur par l'admin.
//
// FLUX :
//   1. L'admin clique sur "Modifier" dans le dashboard
//   2. On récupère l'ID utilisateur depuis l'URL ([id])
//   3. On charge les données de l'utilisateur (mock pour l'instant)
//      ⚠️  TODO back-end : GET /api/v1/admin/users/:id
//   4. Le formulaire s'affiche PRÉ-REMPLI avec toutes ses infos
//   5. L'admin modifie ce qu'il veut et soumet
//      ⚠️  TODO back-end : PUT /api/v1/admin/users/:id
//   6. Retour au dashboard avec message de succès
//
// ⚠️  DONNÉES MOCK :
//   Toutes les données viennent actuellement de MOCK_USERS.
//   Quand le back-end sera prêt, remplacer la fonction
//   fetchUser() par un vrai appel API :
//     const res = await fetch(`/api/v1/admin/users/${id}`, {
//       headers: { Authorization: `Bearer ${getAccessToken()}` }
//     });
//     const user = await res.json();
// ============================================================

import React, { useState, useEffect } from 'react';
import Image         from 'next/image';
import Link          from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { clearTokens }          from '@/lib/authService';
import { APP_ROUTES }           from '@/constants/auth';

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

/** Formulaire d'édition — tous les champs modifiables par l'admin */
interface EditForm {
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  matricule:   string;
  role:        UserRole | '';
  section:     string;
  status:      UserStatus;
}

type FormErrors = Record<string, string | undefined>;

// ─────────────────────────────────────────────────────────────
// DONNÉES MOCK — seront remplacées par des appels API
// ⚠️  TODO : supprimer et remplacer par GET /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: '1',  firstName: 'Jean-Baptiste', lastName: 'Nguema',    email: 'jb.nguema@minfi.cm',    phoneNumber: '+237 677 234 567', matricule: 'FP-001234', role: 'Ordonnateur',          section: 'Direction Générale du Budget',        status: 'actif',      createdAt: '2025-01-15', lastLogin: '2026-03-22' },
  { id: '2',  firstName: 'Aminata',       lastName: 'Bello',     email: 'a.bello@minfi.cm',      phoneNumber: '+237 655 123 456', matricule: 'FP-002345', role: 'Contrôleur financier', section: 'Ministère des Finances (MINFI)',       status: 'actif',      createdAt: '2025-02-03', lastLogin: '2026-03-23' },
  { id: '3',  firstName: 'Pierre',        lastName: 'Mbarga',    email: 'p.mbarga@minfi.cm',     phoneNumber: '+237 699 345 678', matricule: 'FP-003456', role: 'Comptable',            section: 'Direction du Trésor',                 status: 'inactif',    createdAt: '2025-02-18', lastLogin: '2026-02-10' },
  { id: '4',  firstName: 'Fatima',        lastName: 'Oumarou',   email: 'f.oumarou@minfi.cm',    phoneNumber: '+237 678 456 789', matricule: 'FP-004567', role: 'Ordonnateur',          section: 'Ministère de la Santé Publique',      status: 'actif',      createdAt: '2025-03-01', lastLogin: '2026-03-21' },
  { id: '5',  firstName: 'Samuel',        lastName: 'Tchoumba',  email: 's.tchoumba@minfi.cm',   phoneNumber: '+237 691 567 890', matricule: 'FP-005678', role: 'Contrôleur financier', section: "Ministère de l'Éducation de Base",    status: 'en_attente', createdAt: '2026-03-10' },
  { id: '6',  firstName: 'Marie-Claire',  lastName: 'Abanda',    email: 'mc.abanda@minfi.cm',    phoneNumber: '+237 677 678 901', matricule: 'FP-006789', role: 'Comptable',            section: 'Ministère des Travaux Publics',       status: 'actif',      createdAt: '2025-04-12', lastLogin: '2026-03-20' },
  { id: '7',  firstName: 'Alain',         lastName: 'Foko',      email: 'a.foko@minfi.cm',       phoneNumber: '+237 655 789 012', matricule: 'FP-007890', role: 'Ordonnateur',          section: 'Ministère du Plan',                  status: 'actif',      createdAt: '2025-05-08', lastLogin: '2026-03-19' },
  { id: '8',  firstName: 'Carine',        lastName: 'Ngo Biyack',email: 'c.ngobiyack@minfi.cm',  phoneNumber: '+237 699 890 123', matricule: 'FP-008901', role: 'Contrôleur financier', section: "Ministère de l'Agriculture",          status: 'inactif',    createdAt: '2025-06-22', lastLogin: '2026-01-15' },
  { id: '9',  firstName: 'Éric',          lastName: 'Manga',     email: 'e.manga@minfi.cm',      phoneNumber: '+237 678 901 234', matricule: 'FP-009012', role: 'Comptable',            section: 'Ministère de la Justice',            status: 'actif',      createdAt: '2025-07-14', lastLogin: '2026-03-22' },
  { id: '10', firstName: 'Bernadette',    lastName: 'Kom',       email: 'b.kom@minfi.cm',        phoneNumber: '+237 691 012 345', matricule: 'FP-010123', role: 'Ordonnateur',          section: 'Présidence de la République',        status: 'en_attente', createdAt: '2026-03-18' },
  { id: '11', firstName: 'Hervé',         lastName: 'Njoya',     email: 'h.njoya@minfi.cm',      phoneNumber: '+237 677 123 456', matricule: 'FP-011234', role: 'Contrôleur financier', section: 'Ministère des Transports',           status: 'actif',      createdAt: '2025-08-05', lastLogin: '2026-03-21' },
  { id: '12', firstName: 'Sylvie',        lastName: 'Eyebe',     email: 's.eyebe@minfi.cm',      phoneNumber: '+237 655 234 567', matricule: 'FP-012345', role: 'Comptable',            section: "Ministère de l'Eau et de l'Énergie", status: 'actif',      createdAt: '2025-09-19', lastLogin: '2026-03-20' },
];

/**
 * Sections administratives disponibles.
 * ⚠️  TODO back-end : remplacer par GET /api/v1/sections
 */
const SECTIONS = [
  'Présidence de la République',
  'Primature',
  'Ministère des Finances (MINFI)',
  'Direction Générale du Budget',
  'Direction du Trésor',
  'Ministère du Plan et du Développement',
  'Ministère de la Santé Publique',
  "Ministère de l'Éducation de Base",
  'Ministère des Enseignements Secondaires',
  "Ministère de l'Enseignement Supérieur",
  "Ministère de l'Agriculture",
  'Ministère des Travaux Publics',
  'Ministère des Transports',
  "Ministère de l'Eau et de l'Énergie",
  'Ministère de la Justice',
  'Ministère de la Défense',
  "Ministère de l'Administration Territoriale",
  'Ministère du Commerce',
  'Ministère de la Communication',
  'Ministère des Relations Extérieures',
];

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG
// ─────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12,19 5,12 12,5"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/>
  </svg>
);
const IconBadge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);
const IconRole = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// Couleurs par rôle (pour les avatars)
const ROLE_COLORS: Record<string, string> = {
  'Ordonnateur':          '#0D2B55',
  'Contrôleur financier': '#007A3D',
  'Comptable':            '#7C3AED',
};

// Couleurs par statut
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Actif',      color: '#166534', bg: '#F0FDF4' },
  inactif:    { label: 'Inactif',    color: '#991B1B', bg: '#FEF2F2' },
  en_attente: { label: 'En attente', color: '#92400E', bg: '#FFFBEB' },
};

// ─────────────────────────────────────────────────────────────
// VALIDATION LOCALE DU FORMULAIRE
// ─────────────────────────────────────────────────────────────
function validateForm(form: EditForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim())
    errors.firstName = 'Le prénom est requis.';
  else if (form.firstName.length > 50)
    errors.firstName = 'Le prénom ne peut pas dépasser 50 caractères.';

  if (!form.lastName.trim())
    errors.lastName = 'Le nom de famille est requis.';
  else if (form.lastName.length > 50)
    errors.lastName = 'Le nom ne peut pas dépasser 50 caractères.';

  if (!form.email.trim())
    errors.email = "L'adresse email est requise.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "L'adresse email est invalide.";

  if (!form.phoneNumber.trim())
    errors.phoneNumber = 'Le numéro de téléphone est requis.';
  else if (!/^\+?[0-9\s\-]{8,15}$/.test(form.phoneNumber))
    errors.phoneNumber = 'Format invalide. Exemple : +237 6XX XXX XXX';

  if (!form.matricule.trim())
    errors.matricule = 'Le matricule est requis.';

  if (!form.role)
    errors.role = 'Veuillez sélectionner un rôle.';

  if (!form.section.trim())
    errors.section = 'Veuillez sélectionner une section.';

  return errors;
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT CHAMP DE SAISIE (version inline pour éviter la dépendance)
// ─────────────────────────────────────────────────────────────
interface FieldProps {
  id:          string;
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  error?:      string;
  icon:        React.ReactNode;
  type?:       string;
  placeholder?:string;
  disabled?:   boolean;
}

function Field({ id, label, value, onChange, error, icon, type = 'text', placeholder, disabled }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: '.8rem', fontWeight: 600, color: '#4A5568', letterSpacing: '.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {/* Icône gauche */}
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: error ? '#CE1126' : '#8E9BAA',
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            height: 44,
            border: `1.5px solid ${error ? '#CE1126' : '#E8ECF0'}`,
            borderRadius: 8,
            paddingLeft: 40,
            paddingRight: 12,
            fontFamily: 'var(--font-body)',
            fontSize: '.875rem',
            color: '#1A202C',
            background: disabled ? '#F5F6FA' : '#fff',
            outline: 'none',
            transition: 'border-color .15s ease, box-shadow .15s ease',
            boxShadow: error ? '0 0 0 3px rgba(206,17,38,.07)' : 'none',
          }}
          onFocus={e => {
            if (!error) e.target.style.borderColor = '#0D2B55';
            if (!error) e.target.style.boxShadow = '0 0 0 3px rgba(13,43,85,.08)';
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#CE1126' : '#E8ECF0';
            e.target.style.boxShadow = error ? '0 0 0 3px rgba(206,17,38,.07)' : 'none';
          }}
        />
      </div>
      {/* Message d'erreur */}
      {error && (
        <p style={{ fontSize: '.73rem', color: '#CE1126', display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconAlert /> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL — PAGE D'ÉDITION
// ─────────────────────────────────────────────────────────────
export default function EditUserPage() {
  const router = useRouter();

  // Récupérer l'ID depuis l'URL dynamique /admin/users/edit/[id]
  const params = useParams();
  const userId = params?.id as string;

  // ── État de chargement ──
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [originalUser, setOriginalUser] = useState<AdminUser | null>(null);
  const [notFound,     setNotFound]     = useState(false);

  // ── État du formulaire — initialisé vide, rempli après chargement ──
  const [form,        setForm]        = useState<EditForm>({
    firstName:   '',
    lastName:    '',
    email:       '',
    phoneNumber: '',
    matricule:   '',
    role:        '',
    section:     '',
    status:      'actif',
  });

  // ── Erreurs de validation ──
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  // ── Chargement des données de l'utilisateur ──
  useEffect(() => {
    if (!userId) return;

    /**
     * ⚠️  MOCK : recherche dans les données locales
     *
     * TODO back-end — remplacer par :
     *   const res = await fetch(`/api/v1/admin/users/${userId}`, {
     *     headers: { Authorization: `Bearer ${getAccessToken()}` }
     *   });
     *   if (!res.ok) { setNotFound(true); return; }
     *   const user: AdminUser = await res.json();
     */
    const found = MOCK_USERS.find(u => u.id === userId);

    // Simuler un délai réseau pour l'expérience de chargement
    const timer = setTimeout(() => {
      if (!found) {
        setNotFound(true);
      } else {
        // ✅ Stocker l'utilisateur original (pour afficher les infos initiales)
        setOriginalUser(found);

        // ✅ PRÉ-REMPLIR le formulaire avec toutes les données existantes
        setForm({
          firstName:   found.firstName,
          lastName:    found.lastName,
          email:       found.email,
          phoneNumber: found.phoneNumber,
          matricule:   found.matricule,
          role:        found.role,
          section:     found.section,
          status:      found.status,
        });
      }
      setIsLoading(false);
    }, 600); // 600ms de délai simulé

    return () => clearTimeout(timer);
  }, [userId]);

  // ── Mise à jour d'un champ texte ──
  const handleChange = (field: keyof EditForm) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur dès que l'utilisateur corrige le champ
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  // ── Soumission du formulaire ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Étape 1 : Validation locale
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroller vers le premier champ en erreur
      const firstKey = Object.keys(errors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSaving(true);
    setApiError('');

    try {
      /**
       * ⚠️  MOCK : simulation d'une sauvegarde réussie
       *
       * TODO back-end — remplacer par :
       *   const res = await fetch(`/api/v1/admin/users/${userId}`, {
       *     method: 'PUT',
       *     headers: {
       *       'Content-Type': 'application/json',
       *       Authorization: `Bearer ${getAccessToken()}`
       *     },
       *     body: JSON.stringify(form)
       *   });
       *   if (!res.ok) {
       *     const err = await res.json();
       *     throw new Error(err.message || 'Erreur lors de la sauvegarde');
       *   }
       */
      await new Promise(resolve => setTimeout(resolve, 800)); // Simuler délai réseau

      // ✅ Succès → message + retour dashboard après 1.5 secondes
      setSuccessMsg(`Les informations de ${form.firstName} ${form.lastName} ont été mises à jour avec succès.`);
      setTimeout(() => router.push('/admin/dashboard'), 1800);

    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  // ─────────────────────────────────────────────────────────────
  // ÉTATS DE CHARGEMENT / ERREUR
  // ─────────────────────────────────────────────────────────────

  // Écran de chargement
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F6FA', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center', color: '#8E9BAA' }}>
          <div style={{
            width: 44, height: 44,
            border: '3px solid #E8ECF0',
            borderTopColor: '#0D2B55',
            borderRadius: '50%',
            animation: 'spin .7s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: '.875rem' }}>Chargement des informations…</p>
        </div>
      </div>
    );
  }

  // Utilisateur non trouvé
  if (notFound) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F6FA', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#0D2B55', marginBottom: 8 }}>
            Utilisateur introuvable
          </h2>
          <p style={{ fontSize: '.875rem', color: '#8E9BAA', marginBottom: 24 }}>
            L'utilisateur avec l'identifiant <strong>{userId}</strong> n'existe pas ou a été supprimé.
          </p>
          <Link href="/admin/dashboard">
            <button style={{
              padding: '10px 24px', background: '#0D2B55', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600,
            }}>
              Retour au tableau de bord
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDU PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ══════════════════════════════════════════
          SIDEBAR (identique au dashboard)
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

        {/* Breadcrumb dans la sidebar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.55)', textDecoration: 'none', fontSize: '.8rem' }}>
            <IconArrowLeft />
            Retour au tableau de bord
          </Link>
        </div>

        {/* Info utilisateur en cours d'édition */}
        {originalUser && (
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              En cours d'édition
            </p>
            <div style={{
              background: 'rgba(255,255,255,.08)',
              borderRadius: 10,
              padding: '14px',
              border: '1px solid rgba(255,255,255,.1)',
            }}>
              {/* Avatar initiales */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ROLE_COLORS[originalUser.role] ?? '#0D2B55'}cc, ${ROLE_COLORS[originalUser.role] ?? '#0D2B55'})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1rem', fontWeight: 700,
                margin: '0 auto 10px',
              }}>
                {originalUser.firstName[0]}{originalUser.lastName[0]}
              </div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: '.85rem', textAlign: 'center' }}>
                {originalUser.firstName} {originalUser.lastName}
              </p>
              <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)', textAlign: 'center', marginTop: 2 }}>
                {originalUser.email}
              </p>
              <div style={{
                marginTop: 10,
                padding: '4px 10px',
                background: STATUS_CONFIG[originalUser.status].bg,
                borderRadius: 999,
                textAlign: 'center',
                fontSize: '.7rem',
                fontWeight: 600,
                color: STATUS_CONFIG[originalUser.status].color,
              }}>
                {STATUS_CONFIG[originalUser.status].label}
              </div>
              {/* Infos supplémentaires */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  ['Matricule', originalUser.matricule],
                  ['Inscrit le', new Date(originalUser.createdAt).toLocaleDateString('fr-FR')],
                  ['Dernière co.', originalUser.lastLogin ? new Date(originalUser.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem' }}>
                    <span style={{ color: 'rgba(255,255,255,.4)' }}>{label}</span>
                    <span style={{ color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #CE1126, #8B0914)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>AD</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#fff' }}>Administrateur</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)' }}>Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>
            <IconLogout />
            Déconnexion
          </button>
        </div>

        {/* Bandes tricolores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126' }} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/admin/dashboard" style={{ color: '#8E9BAA', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.8rem', textDecoration: 'none' }}>
                Tableau de bord
              </Link>
              <span style={{ color: '#D1D8E0' }}>›</span>
              <span style={{ color: '#8E9BAA', fontSize: '.8rem' }}>Utilisateurs</span>
              <span style={{ color: '#D1D8E0' }}>›</span>
              <span style={{ color: '#0D2B55', fontSize: '.8rem', fontWeight: 600 }}>
                Modifier {originalUser ? `${originalUser.firstName} ${originalUser.lastName}` : ''}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1, marginTop: 2 }}>
              Modifier les informations de l'utilisateur
            </h1>
          </div>

          {/* Bouton retour */}
          <Link href="/admin/dashboard">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px',
              border: '1.5px solid #E8ECF0',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '.82rem', fontWeight: 500, color: '#4A5568',
            }}>
              <IconArrowLeft />
              Retour
            </button>
          </Link>
        </header>

        {/* FORMULAIRE */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* Alerte succès */}
          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 10,
              color: '#166534',
              fontSize: '.875rem',
              fontWeight: 500,
              marginBottom: 24,
              animation: 'fadeSlideDown .3s ease',
            }}>
              <IconCheck />
              {successMsg}
            </div>
          )}

          {/* Alerte erreur API */}
          {apiError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              color: '#991B1B',
              fontSize: '.875rem',
              marginBottom: 24,
            }}>
              <IconAlert />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

              {/* ══════════════════════════════════════════
                  SECTION 1 — INFORMATIONS PERSONNELLES
                  ══════════════════════════════════════════ */}
              <div style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #E8ECF0',
                boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                overflow: 'hidden',
              }}>
                {/* En-tête de section */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 24px',
                  borderBottom: '1px solid #E8ECF0',
                  background: 'rgba(13,43,85,.03)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#0D2B55', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.75rem', fontWeight: 700,
                  }}>1</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0D2B55' }}>
                    <IconUser />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55' }}>
                      Informations personnelles
                    </h2>
                  </div>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Prénom / Nom */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field
                      id="firstName" label="Prénom *"
                      value={form.firstName} onChange={handleChange('firstName')}
                      error={fieldErrors.firstName} icon={<IconUser />}
                      placeholder="ex : Jean-Baptiste"
                    />
                    <Field
                      id="lastName" label="Nom de famille *"
                      value={form.lastName} onChange={handleChange('lastName')}
                      error={fieldErrors.lastName} icon={<IconUser />}
                      placeholder="ex : Nguema"
                    />
                  </div>

                  {/* Email */}
                  <Field
                    id="email" label="Adresse email professionnelle *"
                    value={form.email} onChange={handleChange('email')}
                    error={fieldErrors.email} icon={<IconMail />}
                    type="email" placeholder="prenom.nom@minfi.cm"
                  />

                  {/* Téléphone */}
                  <Field
                    id="phoneNumber" label="Numéro de téléphone *"
                    value={form.phoneNumber} onChange={handleChange('phoneNumber')}
                    error={fieldErrors.phoneNumber} icon={<IconPhone />}
                    type="tel" placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              {/* ══════════════════════════════════════════
                  SECTION 2 — INFORMATIONS PROFESSIONNELLES
                  ══════════════════════════════════════════ */}
              <div style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #E8ECF0',
                boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 24px',
                  borderBottom: '1px solid #E8ECF0',
                  background: 'rgba(13,43,85,.03)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700 }}>2</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconBadge />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55' }}>
                      Informations professionnelles
                    </h2>
                  </div>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Matricule */}
                  <Field
                    id="matricule" label="Matricule (Fonction Publique) *"
                    value={form.matricule} onChange={handleChange('matricule')}
                    error={fieldErrors.matricule} icon={<IconBadge />}
                    placeholder="ex : FP-001234"
                  />

                  {/* Rôle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label htmlFor="role" style={{ fontSize: '.8rem', fontWeight: 600, color: '#4A5568', letterSpacing: '.02em' }}>
                      Rôle dans l'application *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: fieldErrors.role ? '#CE1126' : '#8E9BAA', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <IconRole />
                      </span>
                      <select
                        id="role"
                        value={form.role}
                        onChange={e => { handleChange('role')(e.target.value); }}
                        style={{
                          width: '100%', height: 44,
                          border: `1.5px solid ${fieldErrors.role ? '#CE1126' : '#E8ECF0'}`,
                          borderRadius: 8, paddingLeft: 40, paddingRight: 12,
                          fontFamily: 'var(--font-body)', fontSize: '.875rem',
                          color: form.role ? '#1A202C' : '#8E9BAA',
                          background: '#fff', cursor: 'pointer', outline: 'none',
                          appearance: 'none',
                        }}
                      >
                        <option value="" disabled>Sélectionnez un rôle…</option>
                        <option value="Ordonnateur">Ordonnateur</option>
                        <option value="Contrôleur financier">Contrôleur financier</option>
                        <option value="Comptable">Comptable</option>
                      </select>
                    </div>
                    {fieldErrors.role && (
                      <p style={{ fontSize: '.73rem', color: '#CE1126', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconAlert /> {fieldErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Section administrative */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label htmlFor="section" style={{ fontSize: '.8rem', fontWeight: 600, color: '#4A5568', letterSpacing: '.02em' }}>
                      Section administrative *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: fieldErrors.section ? '#CE1126' : '#8E9BAA', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <IconBuilding />
                      </span>
                      <select
                        id="section"
                        value={form.section}
                        onChange={e => handleChange('section')(e.target.value)}
                        style={{
                          width: '100%', height: 44,
                          border: `1.5px solid ${fieldErrors.section ? '#CE1126' : '#E8ECF0'}`,
                          borderRadius: 8, paddingLeft: 40, paddingRight: 12,
                          fontFamily: 'var(--font-body)', fontSize: '.875rem',
                          color: form.section ? '#1A202C' : '#8E9BAA',
                          background: '#fff', cursor: 'pointer', outline: 'none',
                          appearance: 'none',
                        }}
                      >
                        <option value="" disabled>Sélectionnez une section…</option>
                        {SECTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    {fieldErrors.section && (
                      <p style={{ fontSize: '.73rem', color: '#CE1126', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconAlert /> {fieldErrors.section}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════
                  SECTION 3 — STATUT DU COMPTE
                  ══════════════════════════════════════════ */}
              <div style={{
                background: '#fff',
                borderRadius: 14,
                border: '1px solid #E8ECF0',
                boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 24px',
                  borderBottom: '1px solid #E8ECF0',
                  background: 'rgba(13,43,85,.03)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700 }}>3</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconShield />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55' }}>
                      Statut du compte
                    </h2>
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {/* Sélecteur de statut en cartes cliquables */}
                  <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#4A5568', marginBottom: 12 }}>
                    Statut actuel du compte *
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {(Object.entries(STATUS_CONFIG) as [UserStatus, typeof STATUS_CONFIG[UserStatus]][]).map(([key, cfg]) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 14px',
                          border: `2px solid ${form.status === key ? cfg.color : '#E8ECF0'}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: form.status === key ? cfg.bg : '#fff',
                          transition: 'all .15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={key}
                          checked={form.status === key}
                          onChange={() => handleChange('status')(key)}
                          style={{ display: 'none' }}
                        />
                        {/* Indicateur radio visuel */}
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${form.status === key ? cfg.color : '#D1D8E0'}`,
                          background: form.status === key ? cfg.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {form.status === key && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                              <polyline points="20,6 9,17 4,12"/>
                            </svg>
                          )}
                        </span>
                        <div>
                          <p style={{ fontSize: '.82rem', fontWeight: 600, color: form.status === key ? cfg.color : '#4A5568' }}>
                            {cfg.label}
                          </p>
                          <p style={{ fontSize: '.7rem', color: '#8E9BAA' }}>
                            {key === 'actif' ? 'Accès complet' : key === 'inactif' ? 'Accès bloqué' : 'En cours de validation'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Note informative */}
                  <div style={{
                    marginTop: 14,
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '10px 14px',
                    background: 'rgba(13,43,85,.04)',
                    border: '1px dashed rgba(13,43,85,.2)',
                    borderRadius: 8,
                    fontSize: '.75rem', color: '#0D2B55', lineHeight: 1.5,
                  }}>
                    <IconShield />
                    La modification du statut prend effet immédiatement. Un compte désactivé ne pourra plus se connecter à la plateforme.
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════
                  BOUTONS D'ACTION
                  ══════════════════════════════════════════ */}
              <div style={{
                display: 'flex', gap: 12, justifyContent: 'flex-end',
                padding: '16px 0',
              }}>
                {/* Annuler */}
                <Link href="/admin/dashboard">
                  <button type="button" style={{
                    padding: '12px 24px',
                    border: '1.5px solid #E8ECF0',
                    borderRadius: 10,
                    background: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '.875rem', fontWeight: 500, color: '#4A5568',
                  }}>
                    Annuler
                  </button>
                </Link>

                {/* Sauvegarder */}
                <button
                  type="submit"
                  disabled={isSaving || !!successMsg}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px',
                    border: 'none',
                    borderRadius: 10,
                    background: isSaving || successMsg
                      ? '#8E9BAA'
                      : 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
                    cursor: isSaving || successMsg ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '.875rem', fontWeight: 600, color: '#fff',
                    boxShadow: isSaving || successMsg ? 'none' : '0 4px 16px rgba(13,43,85,.25)',
                    transition: 'all .15s ease',
                  }}
                >
                  {isSaving ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin .65s linear infinite',
                      }} />
                      Sauvegarde en cours…
                    </>
                  ) : successMsg ? (
                    <><IconCheck /> Sauvegardé !</>
                  ) : (
                    <><IconCheck /> Enregistrer les modifications</>
                  )}
                </button>
              </div>

            </div>
          </form>
        </main>
      </div>
    </div>
  );
}