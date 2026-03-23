'use client';

// ============================================================
// FICHIER  : src/app/register/page.tsx
// ============================================================

import React, { useState } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout         from '@/components/auth/AuthLayout';
import Input              from '@/components/ui/Input';
import Button             from '@/components/ui/Button';
import SearchableSelect   from '@/components/ui/SearchableSelect';
import { registerUser }   from '@/lib/authService';
import { ApiError, FormErrors, RegisterPayload } from '@/types/auth';
import { APP_ROUTES }     from '@/constants/auth';
import {
  MOCK_ROLES,
  MOCK_SECTIONS,
  MOCK_PROGRAMMES,
} from '@/data/registerMockData';

// ─────────────────────────────────────────────────────────────
// ICÔNES
// ─────────────────────────────────────────────────────────────
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
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8"  x2="12"    y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
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
const IconCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
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
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// EN-TÊTE DE RUBRIQUE
// ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon:        React.ReactNode;
  number:      number;
  title:       string;
  description: string;
}
function SectionHeader({ icon, number, title, description }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      background: 'rgba(13,43,85,.05)',
      borderRadius: 'var(--radius-md)',
      borderLeft: '3px solid var(--clr-navy)',
      marginBottom: 14,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--clr-navy)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.8rem', fontWeight: 700, flexShrink: 0,
      }}>
        {number}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: 'var(--clr-navy)', display: 'flex' }}>{icon}</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '.92rem', fontWeight: 700, color: 'var(--clr-navy)', lineHeight: 1 }}>
            {title}
          </h3>
        </div>
        <p style={{ fontSize: '.74rem', color: 'var(--clr-gray-400)', lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div style={{
      height: 1,
      background: 'linear-gradient(90deg, transparent, var(--clr-gray-100) 20%, var(--clr-gray-100) 80%, transparent)',
      margin: '6px 0 18px',
    }} />
  );
}

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
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort']    as const;
const STRENGTH_MODS   = ['', 'weak',   'medium', 'strong'] as const;
const STRENGTH_COLORS = ['', 'var(--clr-red)', 'var(--clr-yellow-dark)', 'var(--clr-green)'] as const;

// ─────────────────────────────────────────────────────────────
// VALIDATION LOCALE
// ─────────────────────────────────────────────────────────────
function validate(v: RegisterPayload, programmeIds: string[]): FormErrors {
  const e: FormErrors = {};

  // 1. Personnelles
  if (!v.firstName.trim())           e.firstName   = 'Le prénom est requis.';
  else if (v.firstName.length > 50)  e.firstName   = 'Le prénom ne peut pas dépasser 50 caractères.';
  if (!v.lastName.trim())            e.lastName    = 'Le nom de famille est requis.';
  else if (v.lastName.length > 50)   e.lastName    = 'Le nom ne peut pas dépasser 50 caractères.';
  if (!v.email.trim())               e.email       = "L'adresse email est requise.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
                                     e.email       = "L'adresse email est invalide (ex : prenom.nom@minfi.cm).";
  if (!v.phoneNumber.trim())         e.phoneNumber = 'Le numéro de téléphone est requis.';
  else if (!/^\+?[0-9\s\-]{8,15}$/.test(v.phoneNumber))
                                     e.phoneNumber = 'Format invalide. Exemple : +237 6XX XXX XXX';
  if (!v.dateOfBirth)                e.dateOfBirth = 'La date de naissance est requise.';

  // 2. Professionnelles
  if (!v.matricule.trim())           e.matricule   = 'Le matricule est requis.';
  if (!v.roleId)                     e.roleId      = 'Veuillez sélectionner un rôle.';
  if (!v.sectionId)                  e.sectionId   = 'Veuillez sélectionner une section administrative.';
  if (programmeIds.length === 0)     e.programmeIds = 'Veuillez sélectionner au moins un programme.';

  // 3. CNI
  if (!v.cniNumber.trim())           e.cniNumber       = 'Le numéro de CNI est requis.';
  if (!v.cniDeliveryDate)            e.cniDeliveryDate = 'La date de délivrance est requise.';
  if (!v.cniValidityDate)            e.cniValidityDate = 'La date de validité est requise.';
  if (!v.cniExpiryDate)              e.cniExpiryDate   = "La date d'expiration est requise.";
  else if (v.cniDeliveryDate && v.cniExpiryDate <= v.cniDeliveryDate)
                                     e.cniExpiryDate   = "La date d'expiration doit être après la date de délivrance.";

  // 4. Sécurité
  if (!v.password)                   e.password = 'Le mot de passe est requis.';
  else if (v.password.length < 8)    e.password = 'Au moins 8 caractères requis.';
  else if (v.password.length > 72)   e.password = '72 caractères maximum.';
  else if (!/(?=.*[A-Z])/.test(v.password))        e.password = 'Au moins une lettre majuscule requise (A-Z).';
  else if (!/(?=.*[a-z])/.test(v.password))        e.password = 'Au moins une lettre minuscule requise (a-z).';
  else if (!/(?=.*\d)/.test(v.password))           e.password = 'Au moins un chiffre requis (0-9).';
  else if (!/(?=.*[^A-Za-z\d])/.test(v.password)) e.password = 'Au moins un caractère spécial requis (!, @, #…).';
  if (!v.confirmPassword)            e.confirmPassword = 'Veuillez confirmer votre mot de passe.';
  else if (v.password !== v.confirmPassword)
                                     e.confirmPassword = 'La confirmation ne correspond pas au mot de passe.';
  return e;
}

// État initial
const EMPTY: RegisterPayload = {
  firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '',
  matricule: '', roleId: '', sectionId: '', programmeIds: [],
  cniNumber: '', cniDeliveryDate: '', cniValidityDate: '', cniExpiryDate: '',
  password: '', confirmPassword: '',
  mfaEnabled: true,
};

// ─────────────────────────────────────────────────────────────
// COMPOSANT PAGE
// ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [values,        setValues]        = useState<RegisterPayload>(EMPTY);
  const [programmeIds,  setProgrammeIds]  = useState<string[]>([]);
  const [fieldErrors,   setFieldErrors]   = useState<FormErrors>({});
  const [apiError,      setApiError]      = useState('');
  const [isLoading,     setIsLoading]     = useState(false);
  const [showPwd,       setShowPwd]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const strength = passwordStrength(values.password);

  // Mise à jour des champs texte
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  // Mise à jour d'un champ select simple (role, section)
  const handleSelect = (field: 'roleId' | 'sectionId') => (id: string) => {
    setValues(prev => ({ ...prev, [field]: id }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Mise à jour programmes (multi)
  const handleProgrammes = (ids: string[]) => {
    setProgrammeIds(ids);
    if (fieldErrors.programmeIds) setFieldErrors(prev => ({ ...prev, programmeIds: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...values, programmeIds };
    const errors  = validate(payload, programmeIds);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsLoading(true);
    setApiError('');
    setFieldErrors({});

    try {
      const data = await registerUser(payload);
      const qrImage = data.secretImageUri;
      if (qrImage) {
        sessionStorage.setItem('gbe_qr_code',   qrImage);
        sessionStorage.setItem('gbe_email_2fa', values.email);
        router.push(APP_ROUTES.REGISTER_QR);
      } else {
        setApiError("Inscription réussie mais aucun QR code reçu. Contactez l'administrateur.");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
          if (err.code === 'METHODE_ARGUMENT_NOT_VALID')
            setApiError('Veuillez corriger les erreurs indiquées dans le formulaire.');
        } else {
          setApiError(err.message);
          if (err.code === 'EMAIL_ALREADY_EXISTS') {
            setFieldErrors({ email: err.message });
            document.getElementById('email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (err.code === 'PHONE_NUMBER_ALREADY_EXISTS') {
            setFieldErrors({ phoneNumber: err.message });
            document.getElementById('phoneNumber')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else {
        setApiError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Remplissez les cinq rubriques pour accéder à la plateforme GBE"
      wide
    >
      {apiError && (
        <div className="alert alert--error" role="alert">
          <IconAlert /> {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══════════════════════════════════════════
              RUBRIQUE 1 — INFORMATIONS PERSONNELLES
              ══════════════════════════════════════════ */}
          <SectionHeader number={1} icon={<IconUser />}
            title="Informations personnelles"
            description="Votre état civil tel qu'il apparaît sur vos documents officiels"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-grid-2">
              <Input id="firstName" name="firstName" type="text"
                label="Prénom *" placeholder="Ali"
                value={values.firstName} onChange={handleChange}
                error={fieldErrors.firstName} icon={<IconUser />}
                autoComplete="given-name" disabled={isLoading} autoFocus />
              <Input id="lastName" name="lastName" type="text"
                label="Nom de famille *" placeholder="Bello"
                value={values.lastName} onChange={handleChange}
                error={fieldErrors.lastName} icon={<IconUser />}
                autoComplete="family-name" disabled={isLoading} />
            </div>
            <Input id="email" name="email" type="email"
              label="Adresse email professionnelle *" placeholder="prenom.nom@minfi.cm"
              value={values.email} onChange={handleChange}
              error={fieldErrors.email} icon={<IconMail />}
              autoComplete="email" disabled={isLoading} />
            <div className="form-grid-2">
              <Input id="phoneNumber" name="phoneNumber" type="tel"
                label="Téléphone *" placeholder="+237 6XX XXX XXX"
                value={values.phoneNumber} onChange={handleChange}
                error={fieldErrors.phoneNumber} icon={<IconPhone />}
                autoComplete="tel" disabled={isLoading} />
              <Input id="dateOfBirth" name="dateOfBirth" type="date"
                label="Date de naissance *"
                value={values.dateOfBirth} onChange={handleChange}
                error={fieldErrors.dateOfBirth} icon={<IconCalendar />}
                autoComplete="bday" disabled={isLoading} />
            </div>
          </div>

          <SectionDivider />

          {/* ══════════════════════════════════════════
              RUBRIQUE 2 — INFORMATIONS PROFESSIONNELLES
              ══════════════════════════════════════════ */}
          <SectionHeader number={2} icon={<IconBuilding />}
            title="Informations professionnelles"
            description="Vos identifiants et affectations au sein de la Fonction Publique camerounaise"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Matricule */}
            <Input id="matricule" name="matricule" type="text"
              label="Matricule (Fonction Publique) *" placeholder="ex : FP-23-456789"
              value={values.matricule} onChange={handleChange}
              error={fieldErrors.matricule} icon={<IconBadge />}
              disabled={isLoading} />

            {/* Rôle */}
            <div id="roleId">
              <SearchableSelect
                id="roleId"
                label="Rôle dans l'application *"
                placeholder="Sélectionnez ou recherchez un rôle…"
                options={MOCK_ROLES}
                multiple={false}
                value={values.roleId}
                onChange={handleSelect('roleId')}
                error={fieldErrors.roleId}
                disabled={isLoading}
                icon={<IconRole />}
              />
            </div>

            {/* Section administrative */}
            <div id="sectionId">
              <SearchableSelect
                id="sectionId"
                label="Section administrative (Ministère / Direction) *"
                placeholder="Sélectionnez ou recherchez une section…"
                options={MOCK_SECTIONS.map(s => ({ id: s.id, label: s.label, code: s.code }))}
                multiple={false}
                value={values.sectionId}
                onChange={handleSelect('sectionId')}
                error={fieldErrors.sectionId}
                disabled={isLoading}
                icon={<IconBuilding />}
              />
            </div>

            {/* Programmes — sélection multiple */}
            <div id="programmeIds">
              <SearchableSelect
                id="programmeIds"
                label="Programme(s) budgétaire(s) *"
                placeholder="Sélectionnez un ou plusieurs programmes…"
                options={MOCK_PROGRAMMES.map(p => ({ id: p.id, label: p.label, code: p.code }))}
                multiple={true}
                value={programmeIds}
                onChange={handleProgrammes}
                error={fieldErrors.programmeIds}
                disabled={isLoading}
                icon={<IconGrid />}
              />
              <p style={{ fontSize: '.73rem', color: 'var(--clr-gray-400)', marginTop: 4 }}>
                Vous pouvez sélectionner plusieurs programmes.
              </p>
            </div>

            {/* Note @future */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '9px 12px',
              background: 'rgba(13,43,85,.04)',
              border: '1px dashed rgba(13,43,85,.20)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '.73rem', color: 'var(--clr-navy)', lineHeight: 1.5,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8"  x2="12.01" y2="8"/>
              </svg>
              Ces informations seront vérifiées auprès des registres de la Fonction Publique
              lors de l&apos;activation de votre compte par un administrateur.
            </div>
          </div>

          <SectionDivider />

          {/* ══════════════════════════════════════════
              RUBRIQUE 3 — CARTE NATIONALE D'IDENTITÉ
              ══════════════════════════════════════════ */}
          <SectionHeader number={3} icon={<IconCard />}
            title="Carte Nationale d'Identité (CNI)"
            description="Informations figurant sur votre CNI camerounaise en cours de validité"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input id="cniNumber" name="cniNumber" type="text"
              label="Numéro de la CNI *" placeholder="ex : 1234567A"
              value={values.cniNumber} onChange={handleChange}
              error={fieldErrors.cniNumber} icon={<IconCard />}
              disabled={isLoading} />

            {/* 3 dates sur une ligne */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <Input id="cniDeliveryDate" name="cniDeliveryDate" type="date"
                  label="Date de délivrance *"
                  value={values.cniDeliveryDate} onChange={handleChange}
                  error={fieldErrors.cniDeliveryDate} icon={<IconCalendar />}
                  disabled={isLoading} />
              </div>
              
              <div style={{ minWidth: 0 }}>
                <Input id="cniExpiryDate" name="cniExpiryDate" type="date"
                  label="Date d'expiration *"
                  value={values.cniExpiryDate} onChange={handleChange}
                  error={fieldErrors.cniExpiryDate} icon={<IconCalendar />}
                  disabled={isLoading} />
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '9px 12px',
              background: 'rgba(13,43,85,.04)',
              border: '1px dashed rgba(13,43,85,.20)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '.73rem', color: 'var(--clr-navy)', lineHeight: 1.5,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8"  x2="12.01" y2="8"/>
              </svg>
              Assurez-vous que votre CNI est <strong style={{ marginLeft: 3 }}>en cours de validité</strong>.
              Une CNI expirée entraînera le rejet de votre demande d&apos;accès.
            </div>
          </div>

          <SectionDivider />

          {/* ══════════════════════════════════════════
              RUBRIQUE 4 — SÉCURITÉ DU COMPTE
              ══════════════════════════════════════════ */}
          <SectionHeader number={4} icon={<IconLock />}
            title="Sécurité du compte"
            description="Choisissez un mot de passe fort pour protéger votre accès"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mot de passe */}
            <div>
              <Input id="password" name="password"
                type={showPwd ? 'text' : 'password'}
                label="Mot de passe *" placeholder="••••••••"
                value={values.password} onChange={handleChange}
                error={fieldErrors.password} icon={<IconLock />}
                autoComplete="new-password" disabled={isLoading}
                rightElement={
                  <button type="button" className="pwd-toggle"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}>
                    {showPwd ? <IconEyeOff /> : <IconEye />}
                  </button>
                }
              />
              {values.password && (
                <div style={{ marginTop: 6 }}>
                  <div className="pwd-strength">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`pwd-strength__bar ${strength >= i ? `pwd-strength__bar--${STRENGTH_MODS[strength]}` : ''}`} />
                    ))}
                  </div>
                  <p className="pwd-strength__label">
                    Force : <strong style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <Input id="confirmPassword" name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              label="Confirmer le mot de passe *" placeholder="••••••••"
              value={values.confirmPassword} onChange={handleChange}
              error={fieldErrors.confirmPassword} icon={<IconLock />}
              autoComplete="new-password" disabled={isLoading}
              rightElement={
                <button type="button" className="pwd-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                  {showConfirm ? <IconEyeOff /> : <IconEye />}
                </button>
              }
            />

            {/* Checklist règles */}
            <div style={{
              padding: '10px 14px',
              background: 'rgba(13,43,85,.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(13,43,85,.08)',
            }}>
              <p style={{ fontSize: '.73rem', fontWeight: 600, color: 'var(--clr-navy)', marginBottom: 6 }}>
                Le mot de passe doit contenir :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
                {[
                  { ok: values.password.length >= 8,            label: 'Au moins 8 caractères' },
                  { ok: /[A-Z]/.test(values.password),          label: 'Une majuscule (A-Z)' },
                  { ok: /[a-z]/.test(values.password),          label: 'Une minuscule (a-z)' },
                  { ok: /[0-9]/.test(values.password),          label: 'Un chiffre (0-9)' },
                  { ok: /[^A-Za-z0-9]/.test(values.password),   label: 'Un caractère spécial (!@#…)' },
                ].map(rule => (
                  <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke={rule.ok ? 'var(--clr-green)' : 'var(--clr-gray-200)'}
                      strokeWidth="2.5">
                      {rule.ok ? <polyline points="20,6 9,17 4,12"/> : <circle cx="12" cy="12" r="10"/>}
                    </svg>
                    <span style={{ fontSize: '.71rem', color: rule.ok ? 'var(--clr-green-dark)' : 'var(--clr-gray-400)', fontWeight: rule.ok ? 500 : 400 }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info 2FA */}
            <div className="alert alert--info" style={{ fontSize: '.79rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert__icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Un <strong>QR code</strong> vous sera fourni à l&apos;étape suivante pour configurer
              l&apos;authentification à deux facteurs (obligatoire).
            </div>
          </div>

          {/* Bouton soumettre */}
          <Button type="submit" variant="secondary" isLoading={isLoading} fullWidth>
            {isLoading ? 'Création du compte…' : 'Créer mon compte'}
          </Button>

        </div>
      </form>

      <p className="auth-switch">
        Déjà inscrit ?{' '}
        <Link href={APP_ROUTES.LOGIN}>Se connecter</Link>
      </p>
    </AuthLayout>
  );
}