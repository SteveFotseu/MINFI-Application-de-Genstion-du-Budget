'use client';

// ============================================================
// FICHIER  : src/app/profile/page.tsx
//
// RÔLE     : Page de profil de l'utilisateur connecté.
//
// FONCTIONNALITÉS :
//   - Affichage de toutes les informations du profil
//   - Modification des infos personnelles (prénom, nom, email, téléphone, date de naissance)
//   - Modification du mot de passe (avec vérification de l'ancien)
//   - Informations professionnelles EN LECTURE SEULE (section, programmes)
//   - Icône profil cliquable dans le dashboard → cette page
//
// ⚠️  DONNÉES MOCK (à remplacer par des appels API) :
//   - Chargement profil : GET /api/v1/users/me
//   - Mise à jour infos : PATCH /api/v1/users/me
//   - Changement mdp   : POST /api/v1/users/me/password
// ============================================================

import React, { useState, useEffect } from 'react';
import Image         from 'next/image';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import { clearTokens, getAccessToken } from '@/lib/authService';
import { APP_ROUTES }                  from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

/** Données complètes du profil utilisateur */
interface UserProfile {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  dateOfBirth: string;       // "YYYY-MM-DD"
  matricule:   string;
  role:        string;
  section:     string;
  programmes:  string[];     // Lecture seule — attribués par l'admin
  status:      'actif' | 'inactif' | 'en_attente';
  createdAt:   string;
  lastLogin:   string;
  mfaEnabled:  boolean;
}

/** Formulaire de modification des infos personnelles */
interface PersonalForm {
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  dateOfBirth: string;
}

/** Formulaire de changement de mot de passe */
interface PasswordForm {
  currentPassword:  string;
  newPassword:      string;
  confirmPassword:  string;
}

type FormErrors = Record<string, string | undefined>;

// ─────────────────────────────────────────────────────────────
// DONNÉES MOCK
// ⚠️  TODO back-end : remplacer par GET /api/v1/users/me
//     avec le token JWT dans le header Authorization
// ─────────────────────────────────────────────────────────────
const MOCK_PROFILE: UserProfile = {
  id:          '2',
  firstName:   'Aminata',
  lastName:    'Bello',
  email:       'a.bello@minfi.cm',
  phoneNumber: '+237 655 123 456',
  dateOfBirth: '1988-04-15',
  matricule:   'FP-002345',
  role:        'Contrôleur financier',
  section:     'Ministère des Finances (MINFI)',
  programmes:  ['Gestion des Finances Publiques', 'Gouvernance et Institutions'],
  status:      'actif',
  createdAt:   '2025-02-03',
  lastLogin:   '2026-03-23',
  mfaEnabled:  true,
};

// ─────────────────────────────────────────────────────────────
// COULEURS PAR RÔLE
// ─────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  'Ordonnateur':          { bg: 'rgba(13,43,85,.1)',    color: '#0D2B55' },
  'Contrôleur financier': { bg: 'rgba(0,122,61,.1)',    color: '#007A3D' },
  'Comptable':            { bg: 'rgba(124,58,237,.1)',  color: '#7C3AED' },
  'Administrateur':       { bg: 'rgba(206,17,38,.1)',   color: '#CE1126' },
};

const STATUS_CONFIG = {
  actif:      { label: 'Actif',      color: '#166534', bg: '#F0FDF4', dot: '#22C55E' },
  inactif:    { label: 'Inactif',    color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
  en_attente: { label: 'En attente', color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
};

// ─────────────────────────────────────────────────────────────
// FORCE DU MOT DE PASSE
// ─────────────────────────────────────────────────────────────
function passwordStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3;
}
const STRENGTH_LABELS = ['',    'Faible', 'Moyen',  'Fort'   ] as const;
const STRENGTH_COLORS = ['',    '#CE1126', '#D97706', '#007A3D'] as const;
const STRENGTH_MODS   = ['',    'weak',    'medium',  'strong' ] as const;

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG
// ─────────────────────────────────────────────────────────────
const IconUser      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/></svg>;
const IconCalendar  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconLock      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconEye       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconShield    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconBuilding  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
const IconGrid      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconBadge     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>;
const IconEdit      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>;
const IconAlert     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconLogout    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconInfo      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;

// ─────────────────────────────────────────────────────────────
// COMPOSANT CHAMP TEXTE
// ─────────────────────────────────────────────────────────────
interface FieldProps {
  id:           string;
  label:        string;
  value:        string;
  onChange?:    (v: string) => void;
  error?:       string;
  icon:         React.ReactNode;
  type?:        string;
  placeholder?: string;
  disabled?:    boolean;
  readOnly?:    boolean;
  rightEl?:     React.ReactNode;
}

function Field({ id, label, value, onChange, error, icon, type = 'text', placeholder, disabled, readOnly, rightEl }: FieldProps) {
  const isLocked = disabled || readOnly;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{
        fontSize: '.78rem', fontWeight: 600,
        color: isLocked ? '#8E9BAA' : '#4A5568',
        letterSpacing: '.02em',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        {/* Badge "lecture seule" pour les champs non modifiables */}
        {readOnly && (
          <span style={{
            fontSize: '.63rem', fontWeight: 500,
            color: '#8E9BAA', background: '#F0F2F5',
            padding: '1px 6px', borderRadius: 999,
          }}>
            Lecture seule
          </span>
        )}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: isLocked ? '#C4CAD0' : (error ? '#CE1126' : '#8E9BAA'),
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          style={{
            width: '100%', height: 44,
            border: `1.5px solid ${error ? '#CE1126' : isLocked ? '#E8ECF0' : '#D1D8E0'}`,
            borderRadius: 8,
            paddingLeft: 40,
            paddingRight: rightEl ? 42 : 12,
            fontFamily: 'var(--font-body)',
            fontSize: '.875rem',
            color: isLocked ? '#8E9BAA' : '#1A202C',
            background: isLocked ? '#F8F9FB' : '#fff',
            outline: 'none',
            cursor: isLocked ? 'default' : 'text',
            transition: 'border-color .15s, box-shadow .15s',
            boxShadow: error ? '0 0 0 3px rgba(206,17,38,.07)' : 'none',
          }}
          onFocus={e => {
            if (!isLocked && !error) {
              e.target.style.borderColor = '#0D2B55';
              e.target.style.boxShadow = '0 0 0 3px rgba(13,43,85,.08)';
            }
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#CE1126' : isLocked ? '#E8ECF0' : '#D1D8E0';
            e.target.style.boxShadow = error ? '0 0 0 3px rgba(206,17,38,.07)' : 'none';
          }}
        />
        {rightEl && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            {rightEl}
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '.72rem', color: '#CE1126', display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconAlert /> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT EN-TÊTE DE SECTION
// ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  number:      number;
  icon:        React.ReactNode;
  title:       string;
  description: string;
  accent?:     string;
}
function SectionHeader({ number, icon, title, description, accent = '#0D2B55' }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 20px',
      borderBottom: '1px solid #E8ECF0',
      background: 'rgba(13,43,85,.025)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.75rem', fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>
        {number}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: accent }}>{icon}</span>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1.2 }}>
            {title}
          </h2>
          <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();

  // ── État chargement ──
  const [isLoading, setIsLoading] = useState(true);
  const [profile,   setProfile]   = useState<UserProfile | null>(null);

  // ── Onglet actif : 'info' | 'password' ──
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // ── Formulaire infos personnelles ──
  const [personalForm,   setPersonalForm]   = useState<PersonalForm>({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '' });
  const [personalErrors, setPersonalErrors] = useState<FormErrors>({});
  const [isSavingInfo,   setIsSavingInfo]   = useState(false);
  const [infoSuccess,    setInfoSuccess]    = useState('');
  const [infoError,      setInfoError]      = useState('');

  // ── Formulaire mot de passe ──
  const [pwdForm,     setPwdForm]     = useState<PasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors,   setPwdErrors]   = useState<FormErrors>({});
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [pwdSuccess,  setPwdSuccess]  = useState('');
  const [pwdError,    setPwdError]    = useState('');

  // ── Visibilité des mots de passe ──
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const strength = passwordStrength(pwdForm.newPassword);

  // ─────────────────────────────────────────────────────────────
  // CHARGEMENT DU PROFIL
  // ⚠️  MOCK — remplacer par :
  //   const res = await fetch('/api/v1/users/me', {
  //     headers: { Authorization: `Bearer ${getAccessToken()}` }
  //   });
  //   const data: UserProfile = await res.json();
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Vérifier que l'utilisateur est connecté
    const token = getAccessToken();
    if (!token) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }

    // Simuler un délai réseau
    const timer = setTimeout(() => {
      setProfile(MOCK_PROFILE);
      // Pré-remplir le formulaire avec les données du profil
      setPersonalForm({
        firstName:   MOCK_PROFILE.firstName,
        lastName:    MOCK_PROFILE.lastName,
        email:       MOCK_PROFILE.email,
        phoneNumber: MOCK_PROFILE.phoneNumber,
        dateOfBirth: MOCK_PROFILE.dateOfBirth,
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  // ─────────────────────────────────────────────────────────────
  // VALIDATION INFOS PERSONNELLES
  // ─────────────────────────────────────────────────────────────
  function validatePersonal(form: PersonalForm): FormErrors {
    const e: FormErrors = {};
    if (!form.firstName.trim())            e.firstName   = 'Le prénom est requis.';
    else if (form.firstName.length > 50)   e.firstName   = 'Max 50 caractères.';
    if (!form.lastName.trim())             e.lastName    = 'Le nom est requis.';
    else if (form.lastName.length > 50)    e.lastName    = 'Max 50 caractères.';
    if (!form.email.trim())                e.email       = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                           e.email       = "L'email est invalide.";
    if (!form.phoneNumber.trim())          e.phoneNumber = 'Le téléphone est requis.';
    else if (!/^\+?[0-9\s\-]{8,15}$/.test(form.phoneNumber))
                                           e.phoneNumber = 'Format invalide. Ex : +237 6XX XXX XXX';
    if (!form.dateOfBirth)                 e.dateOfBirth = 'La date de naissance est requise.';
    return e;
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATION MOT DE PASSE
  // ─────────────────────────────────────────────────────────────
  function validatePassword(form: PasswordForm): FormErrors {
    const e: FormErrors = {};
    if (!form.currentPassword)
      e.currentPassword = 'Veuillez saisir votre mot de passe actuel.';

    if (!form.newPassword)
      e.newPassword = 'Le nouveau mot de passe est requis.';
    else if (form.newPassword.length < 8)
      e.newPassword = 'Au moins 8 caractères.';
    else if (!/(?=.*[A-Z])/.test(form.newPassword))
      e.newPassword = 'Au moins une lettre majuscule (A-Z).';
    else if (!/(?=.*[a-z])/.test(form.newPassword))
      e.newPassword = 'Au moins une lettre minuscule (a-z).';
    else if (!/(?=.*\d)/.test(form.newPassword))
      e.newPassword = 'Au moins un chiffre (0-9).';
    else if (!/(?=.*[^A-Za-z\d])/.test(form.newPassword))
      e.newPassword = 'Au moins un caractère spécial (!@#…).';
    else if (form.newPassword === form.currentPassword)
      e.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien.';

    if (!form.confirmPassword)
      e.confirmPassword = 'Veuillez confirmer votre nouveau mot de passe.';
    else if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = 'La confirmation ne correspond pas au nouveau mot de passe.';

    return e;
  }

  // ─────────────────────────────────────────────────────────────
  // SOUMISSION — INFOS PERSONNELLES
  // ⚠️  MOCK — remplacer par :
  //   await fetch('/api/v1/users/me', {
  //     method: 'PATCH',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${getAccessToken()}`
  //     },
  //     body: JSON.stringify(personalForm)
  //   });
  // ─────────────────────────────────────────────────────────────
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePersonal(personalForm);
    if (Object.keys(errors).length > 0) { setPersonalErrors(errors); return; }

    setIsSavingInfo(true);
    setInfoError('');
    setInfoSuccess('');

    try {
      await new Promise(res => setTimeout(res, 800)); // Simuler appel API

      // ✅ Mettre à jour l'affichage du profil localement
      setProfile(prev => prev ? { ...prev, ...personalForm } : prev);
      setInfoSuccess('Vos informations personnelles ont été mises à jour avec succès.');
      setTimeout(() => setInfoSuccess(''), 4000);
    } catch {
      setInfoError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SOUMISSION — CHANGEMENT MOT DE PASSE
  // ⚠️  MOCK — le back-end vérifiera le currentPassword côté serveur.
  //   Remplacer par :
  //   const res = await fetch('/api/v1/users/me/password', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${getAccessToken()}`
  //     },
  //     body: JSON.stringify({
  //       currentPassword: pwdForm.currentPassword,
  //       newPassword:     pwdForm.newPassword,
  //       confirmPassword: pwdForm.confirmPassword
  //     })
  //   });
  //   if (!res.ok) {
  //     const err = await res.json();
  //     // Si err.code === 'INVALID_CURRENT_PASSWORD' → champ currentPassword en erreur
  //   }
  // ─────────────────────────────────────────────────────────────
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePassword(pwdForm);
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return; }

    setIsSavingPwd(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      await new Promise(res => setTimeout(res, 900)); // Simuler appel API

      // ⚠️  MOCK : simuler la vérification de l'ancien mot de passe.
      // En production, cette vérification se fait CÔTÉ BACK-END.
      // Le back-end retournera une erreur 401 si l'ancien mdp est incorrect.
      const MOCK_CURRENT_PASSWORD = 'P@ssw0rd'; // Simulé
      if (pwdForm.currentPassword !== MOCK_CURRENT_PASSWORD) {
        setPwdErrors({ currentPassword: 'Mot de passe actuel incorrect. Veuillez réessayer.' });
        return;
      }

      // ✅ Succès
      setPwdSuccess('Votre mot de passe a été modifié avec succès.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch {
      setPwdError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(APP_ROUTES.LOGIN);
  };

  // ─────────────────────────────────────────────────────────────
  // ÉCRAN DE CHARGEMENT
  // ─────────────────────────────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center', color: '#8E9BAA' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #E8ECF0', borderTopColor: '#0D2B55', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 16px' }} />
          <p>Chargement de votre profil…</p>
        </div>
      </div>
    );
  }

  const roleStyle = ROLE_COLORS[profile.role] ?? { bg: 'rgba(13,43,85,.1)', color: '#0D2B55' };
  const statusCfg = STATUS_CONFIG[profile.status];

  // ─────────────────────────────────────────────────────────────
  // RENDU PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ══════════════════════════════════════════
          TOPBAR DE NAVIGATION
          ══════════════════════════════════════════ */}
      <nav style={{
        background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(13,43,85,.30)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo + nom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/images/logo-minfi.png" alt="MINFI" width={36} height={36}
            style={{ borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.3)' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>GBE – MINFI</p>
            <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.55)', letterSpacing: '.05em' }}>Gestion du Budget de l'État</p>
          </div>
        </div>

        {/* Navigation centrale */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'Accueil',  href: APP_ROUTES.DASHBOARD },
            { label: 'Budget',   href: '#' },
            { label: 'Rapports', href: '#' },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <button style={{
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,.7)', fontSize: '.82rem', fontWeight: 500,
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                {item.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Droite : profil + déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Retour au dashboard */}
          <Link href={APP_ROUTES.DASHBOARD}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
              color: '#fff', fontSize: '.8rem', fontWeight: 500,
              padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              <IconArrowLeft />
              Tableau de bord
            </button>
          </Link>
          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(206,17,38,.2)', border: '1px solid rgba(206,17,38,.4)',
              color: '#fff', fontSize: '.8rem', fontWeight: 500,
              padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
            <IconLogout />
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Bandes tricolores sous la topbar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
        <div style={{ background: '#007A3D' }} />
        <div style={{ background: '#CE1126' }} />
        <div style={{ background: '#FCD116' }} />
      </div>

      {/* ══════════════════════════════════════════
          CONTENU PRINCIPAL
          ══════════════════════════════════════════ */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Fil d'Ariane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: '.78rem', color: '#8E9BAA' }}>
          <Link href={APP_ROUTES.DASHBOARD} style={{ color: '#8E9BAA', textDecoration: 'none' }}>Tableau de bord</Link>
          <span>›</span>
          <span style={{ color: '#0D2B55', fontWeight: 600 }}>Mon profil</span>
        </div>

        {/* ── CARTE IDENTITÉ (en haut, toujours visible) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0D2B55 0%, #1A3A6B 100%)',
          borderRadius: 18,
          padding: '28px 32px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          boxShadow: '0 8px 32px rgba(13,43,85,.20)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'cardReveal .4s cubic-bezier(.22,.68,0,1.2) both',
        }}>
          {/* Décor cercle fond */}
          <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(252,209,22,.05)', pointerEvents: 'none' }} />

          {/* Avatar avec initiales */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${roleStyle.color}cc, ${roleStyle.color})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.6rem', fontWeight: 700, flexShrink: 0,
            border: '3px solid rgba(255,255,255,.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,.2)',
            position: 'relative', zIndex: 1,
          }}>
            {profile.firstName[0]}{profile.lastName[0]}
          </div>

          {/* Infos identité */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
              {profile.firstName} {profile.lastName}
            </p>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginTop: 4 }}>
              {profile.email}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {/* Badge rôle */}
              <span style={{
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,.12)',
                color: '#FCD116', fontSize: '.75rem', fontWeight: 600,
              }}>
                {profile.role}
              </span>
              {/* Badge statut */}
              <span style={{
                padding: '4px 12px', borderRadius: 999,
                background: statusCfg.bg,
                color: statusCfg.color, fontSize: '.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot }} />
                {statusCfg.label}
              </span>
              {/* Badge 2FA */}
              {profile.mfaEnabled && (
                <span style={{
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(0,122,61,.25)', border: '1px solid rgba(0,122,61,.4)',
                  color: '#86EFAC', fontSize: '.75rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <IconShield /> 2FA activé
                </span>
              )}
            </div>
          </div>

          {/* Infos rapides droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1, flexShrink: 0 }}>
            {[
              { label: 'Matricule',     value: profile.matricule },
              { label: 'Inscrit le',    value: new Date(profile.createdAt).toLocaleDateString('fr-FR') },
              { label: 'Dernière co.',  value: new Date(profile.lastLogin).toLocaleDateString('fr-FR') },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Bandes tricolores en bas */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style={{ background: '#007A3D' }} />
            <div style={{ background: '#CE1126' }} />
            <div style={{ background: '#FCD116' }} />
          </div>
        </div>

        {/* ── ONGLETS ── */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: '#fff',
          borderRadius: 12,
          padding: 5,
          border: '1px solid #E8ECF0',
          boxShadow: '0 1px 6px rgba(0,0,0,.05)',
          marginBottom: 20,
          width: 'fit-content',
        }}>
          {([
            { id: 'info',     label: '✏️  Mes informations',   },
            { id: 'password', label: '🔒  Mot de passe',       },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 22px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '.85rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#fff' : '#8E9BAA',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #0D2B55, #1A3A6B)'
                  : 'transparent',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(13,43,85,.22)' : 'none',
                transition: 'all .18s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            ONGLET 1 — INFORMATIONS PERSONNELLES
            ════════════════════════════════════════ */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeSlideDown .25s ease' }}>

            {/* Alerte succès */}
            {infoSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, color: '#166534', fontSize: '.875rem', fontWeight: 500 }}>
                <IconCheck /> {infoSuccess}
              </div>
            )}
            {infoError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: '.875rem' }}>
                <IconAlert /> {infoError}
              </div>
            )}

            <form onSubmit={handleSavePersonal} noValidate>

              {/* ── Infos modifiables ── */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
                <SectionHeader
                  number={1} icon={<IconEdit />}
                  title="Informations modifiables"
                  description="Ces informations peuvent être mises à jour par vous-même"
                />
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Prénom / Nom */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field id="firstName" label="Prénom *" value={personalForm.firstName}
                      onChange={v => { setPersonalForm(p => ({ ...p, firstName: v })); setPersonalErrors(e => ({ ...e, firstName: undefined })); }}
                      error={personalErrors.firstName} icon={<IconUser />} placeholder="Votre prénom" />
                    <Field id="lastName" label="Nom de famille *" value={personalForm.lastName}
                      onChange={v => { setPersonalForm(p => ({ ...p, lastName: v })); setPersonalErrors(e => ({ ...e, lastName: undefined })); }}
                      error={personalErrors.lastName} icon={<IconUser />} placeholder="Votre nom" />
                  </div>
                  <Field id="email" label="Adresse email *" value={personalForm.email}
                    onChange={v => { setPersonalForm(p => ({ ...p, email: v })); setPersonalErrors(e => ({ ...e, email: undefined })); }}
                    error={personalErrors.email} icon={<IconMail />} type="email" placeholder="votre@email.cm" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field id="phoneNumber" label="Téléphone *" value={personalForm.phoneNumber}
                      onChange={v => { setPersonalForm(p => ({ ...p, phoneNumber: v })); setPersonalErrors(e => ({ ...e, phoneNumber: undefined })); }}
                      error={personalErrors.phoneNumber} icon={<IconPhone />} type="tel" placeholder="+237 6XX XXX XXX" />
                    <Field id="dateOfBirth" label="Date de naissance *" value={personalForm.dateOfBirth}
                      onChange={v => { setPersonalForm(p => ({ ...p, dateOfBirth: v })); setPersonalErrors(e => ({ ...e, dateOfBirth: undefined })); }}
                      error={personalErrors.dateOfBirth} icon={<IconCalendar />} type="date" />
                  </div>
                </div>
              </div>

              {/* ── Infos professionnelles — LECTURE SEULE ── */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 20 }}>
                <SectionHeader
                  number={2} icon={<IconBuilding />}
                  title="Informations professionnelles"
                  description="Ces informations sont gérées par l'administrateur — non modifiables"
                  accent="#8E9BAA"
                />
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Note explicative */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '10px 14px',
                    background: '#FFFBEB', border: '1px solid #FCD116',
                    borderRadius: 8, fontSize: '.75rem', color: '#92400E', lineHeight: 1.5,
                  }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}><IconInfo /></span>
                    Pour modifier votre section, vos programmes ou votre rôle, veuillez contacter votre administrateur.
                  </div>

                  {/* Matricule — lecture seule */}
                  <Field id="matricule" label="Matricule (Fonction Publique)"
                    value={profile.matricule} icon={<IconBadge />} readOnly />

                  {/* Rôle — lecture seule */}
                  <Field id="role" label="Rôle dans l'application"
                    value={profile.role} icon={<IconShield />} readOnly />

                  {/* Section — lecture seule */}
                  <Field id="section" label="Section administrative"
                    value={profile.section} icon={<IconBuilding />} readOnly />

                  {/* Programmes — lecture seule, affichés en badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{
                      fontSize: '.78rem', fontWeight: 600, color: '#8E9BAA',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <IconGrid /> Programme(s) budgétaire(s)
                      <span style={{ fontSize: '.63rem', fontWeight: 500, color: '#8E9BAA', background: '#F0F2F5', padding: '1px 6px', borderRadius: 999 }}>
                        Lecture seule
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: '#F8F9FB', borderRadius: 8, border: '1.5px solid #E8ECF0', minHeight: 44 }}>
                      {profile.programmes.map(prog => (
                        <span key={prog} style={{
                          padding: '4px 12px', borderRadius: 999,
                          background: 'rgba(13,43,85,.08)',
                          color: '#0D2B55', fontSize: '.78rem', fontWeight: 500,
                        }}>
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton sauvegarder */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    // Réinitialiser au valeurs initiales du profil
                    setPersonalForm({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phoneNumber: profile.phoneNumber, dateOfBirth: profile.dateOfBirth });
                    setPersonalErrors({});
                  }}
                  style={{ padding: '11px 22px', border: '1.5px solid #E8ECF0', borderRadius: 9, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 500, color: '#4A5568' }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 26px', border: 'none', borderRadius: 9,
                    background: isSavingInfo ? '#8E9BAA' : 'linear-gradient(135deg, #0D2B55, #1A3A6B)',
                    cursor: isSavingInfo ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff',
                    boxShadow: isSavingInfo ? 'none' : '0 4px 14px rgba(13,43,85,.25)',
                    transition: 'all .15s',
                  }}>
                  {isSavingInfo ? (
                    <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite' }} /> Sauvegarde…</>
                  ) : (
                    <><IconCheck /> Enregistrer les modifications</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════
            ONGLET 2 — MOT DE PASSE
            ════════════════════════════════════════ */}
        {activeTab === 'password' && (
          <div style={{ animation: 'fadeSlideDown .25s ease' }}>

            {pwdSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, color: '#166534', fontSize: '.875rem', fontWeight: 500, marginBottom: 20 }}>
                <IconCheck /> {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: '.875rem', marginBottom: 20 }}>
                <IconAlert /> {pwdError}
              </div>
            )}

            <form onSubmit={handleSavePassword} noValidate>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                <SectionHeader
                  number={1} icon={<IconLock />}
                  title="Modifier le mot de passe"
                  description="Saisissez votre mot de passe actuel pour confirmer votre identité"
                  accent="#CE1126"
                />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Mot de passe actuel */}
                  <Field
                    id="currentPassword"
                    label="Mot de passe actuel *"
                    value={pwdForm.currentPassword}
                    onChange={v => { setPwdForm(p => ({ ...p, currentPassword: v })); setPwdErrors(e => ({ ...e, currentPassword: undefined })); }}
                    error={pwdErrors.currentPassword}
                    icon={<IconLock />}
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Saisissez votre mot de passe actuel"
                    rightEl={
                      <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', display: 'flex', alignItems: 'center', padding: 0 }}>
                        {showCurrent ? <IconEyeOff /> : <IconEye />}
                      </button>
                    }
                  />

                  {/* Séparateur */}
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E8ECF0 20%, #E8ECF0 80%, transparent)', margin: '4px 0' }} />

                  {/* Nouveau mot de passe */}
                  <div>
                    <Field
                      id="newPassword"
                      label="Nouveau mot de passe *"
                      value={pwdForm.newPassword}
                      onChange={v => { setPwdForm(p => ({ ...p, newPassword: v })); setPwdErrors(e => ({ ...e, newPassword: undefined })); }}
                      error={pwdErrors.newPassword}
                      icon={<IconLock />}
                      type={showNew ? 'text' : 'password'}
                      placeholder="Choisissez un nouveau mot de passe fort"
                      rightEl={
                        <button type="button" onClick={() => setShowNew(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', display: 'flex', alignItems: 'center', padding: 0 }}>
                          {showNew ? <IconEyeOff /> : <IconEye />}
                        </button>
                      }
                    />
                    {/* Indicateur de force */}
                    {pwdForm.newPassword && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 999,
                              background: strength >= i ? STRENGTH_COLORS[strength] : '#E8ECF0',
                              transition: 'background .25s',
                            }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 4 }}>
                          Force : <strong style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmation */}
                  <Field
                    id="confirmPassword"
                    label="Confirmer le nouveau mot de passe *"
                    value={pwdForm.confirmPassword}
                    onChange={v => { setPwdForm(p => ({ ...p, confirmPassword: v })); setPwdErrors(e => ({ ...e, confirmPassword: undefined })); }}
                    error={pwdErrors.confirmPassword}
                    icon={<IconLock />}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Répétez le nouveau mot de passe"
                    rightEl={
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', display: 'flex', alignItems: 'center', padding: 0 }}>
                        {showConfirm ? <IconEyeOff /> : <IconEye />}
                      </button>
                    }
                  />

                  {/* Règles du mot de passe */}
                  <div style={{ padding: '12px 16px', background: 'rgba(13,43,85,.03)', borderRadius: 8, border: '1px solid rgba(13,43,85,.08)' }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 600, color: '#0D2B55', marginBottom: 8 }}>Le mot de passe doit contenir :</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                      {[
                        { ok: pwdForm.newPassword.length >= 8,            label: 'Au moins 8 caractères' },
                        { ok: /[A-Z]/.test(pwdForm.newPassword),          label: 'Une majuscule (A-Z)' },
                        { ok: /[a-z]/.test(pwdForm.newPassword),          label: 'Une minuscule (a-z)' },
                        { ok: /[0-9]/.test(pwdForm.newPassword),          label: 'Un chiffre (0-9)' },
                        { ok: /[^A-Za-z0-9]/.test(pwdForm.newPassword),   label: 'Un caractère spécial (!@#…)' },
                      ].map(rule => (
                        <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={rule.ok ? '#007A3D' : '#D1D8E0'} strokeWidth="2.5">
                            {rule.ok ? <polyline points="20,6 9,17 4,12"/> : <circle cx="12" cy="12" r="10"/>}
                          </svg>
                          <span style={{ fontSize: '.71rem', color: rule.ok ? '#007A3D' : '#8E9BAA', fontWeight: rule.ok ? 500 : 400 }}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer boutons */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #E8ECF0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => { setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwdErrors({}); }}
                    style={{ padding: '11px 22px', border: '1.5px solid #E8ECF0', borderRadius: 9, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 500, color: '#4A5568' }}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPwd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 26px', border: 'none', borderRadius: 9,
                      background: isSavingPwd ? '#8E9BAA' : 'linear-gradient(135deg, #CE1126, #8B0914)',
                      cursor: isSavingPwd ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff',
                      boxShadow: isSavingPwd ? 'none' : '0 4px 14px rgba(206,17,38,.3)',
                      transition: 'all .15s',
                    }}>
                    {isSavingPwd ? (
                      <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite' }} /> Modification…</>
                    ) : (
                      <><IconShield /> Modifier le mot de passe</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}