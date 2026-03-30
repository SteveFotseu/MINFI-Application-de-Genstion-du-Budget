'use client';

// ============================================================
// FICHIER  : src/app/register/page.tsx
// RÔLE     : Création d'un utilisateur par l'ADMINISTRATEUR.
//
// CORRECTIONS APPORTÉES :
//   - fetchSectionsByExercice : libelleFr + codeSection (au lieu de libelle + code)
//   - fetchProgrammes         : libelleFr + codeProgramme (au lieu de libelle + code)
//   - fetchActions            : libelleFr + codeAction    (au lieu de libelle + code)
//   - Proxy manquant créé     : /api/referentiel/sections/exercice/[exerciceId]/route.ts
//
// FLUX :
//   Exercice → Sections → Programmes → Actions (cascade)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import Input              from '@/components/ui/Input';
import Button             from '@/components/ui/Button';
import SearchableSelect   from '@/components/ui/SearchableSelect';
import { createUser, getAccessToken, clearTokens, getUserContext } from '@/lib/authService';
import { ApiError, FormErrors, AdminCreateUserPayload } from '@/types/auth';
import { ADMIN_ENDPOINTS, APP_ROUTES, REFERENTIEL_ENDPOINTS }           from '@/constants/auth';
import type { SelectOption } from '@/components/ui/SearchableSelect';

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG INLINE
// ─────────────────────────────────────────────────────────────
const IconUser      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/></svg>;
const IconCalendar  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconLock      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconEye       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconAlert     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBuilding  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
const IconBadge     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>;
const IconCard      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconRole      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconGrid      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconCheck     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>;
const IconArrow     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconSpinner   = () => <span style={{ width: 14, height: 14, border: '2px solid #E8ECF0', borderTopColor: '#0D2B55', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block', flexShrink: 0 }} />;

// ─────────────────────────────────────────────────────────────
// COMPOSANTS UTILITAIRES
// ─────────────────────────────────────────────────────────────
interface SectionHeaderProps { icon: React.ReactNode; number: number; title: string; description: string; }
function SectionHeader({ icon, number, title, description }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'rgba(13,43,85,.05)', borderRadius: 10, borderLeft: '3px solid #0D2B55', marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0D2B55', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: '#0D2B55', display: 'flex' }}>{icon}</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '.92rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>{title}</h3>
        </div>
        <p style={{ fontSize: '.74rem', color: '#8E9BAA', lineHeight: 1.4 }}>{description}</p>
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #E8ECF0 20%, #E8ECF0 80%, transparent)', margin: '6px 0 18px' }} />;
}

function passwordStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3;
}
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort']      as const;
const STRENGTH_MODS   = ['', 'weak',   'medium', 'strong']   as const;
const STRENGTH_COLORS = ['', '#CE1126', '#D97706', '#007A3D'] as const;

// ─────────────────────────────────────────────────────────────
// TYPES DU FORMULAIRE
// ─────────────────────────────────────────────────────────────
interface FormValues {
  firstName:    string;
  lastName:     string;
  email:        string;
  phoneNumber:  string;
  exerciceId:   string;
  matricule:    string;
  nui:          string;
  roleSysteme:  string;
  sectionId:    string;
  programmeIds: string[];
  actionIds:    string[];
  numeroCni:    string;
  cniIssueDate: string;
  cniExpiryDate: string;
  password:     string;
  confirmPassword: string;
}

const EMPTY_FORM: FormValues = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  exerciceId: '', matricule: '', nui: '', roleSysteme: '',
  sectionId: '', programmeIds: [], actionIds: [],
  numeroCni: '', cniIssueDate: '', cniExpiryDate: '',
  password: '', confirmPassword: '',
};

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (!v.firstName.trim())   e.firstName   = 'Le prénom est requis.';
  if (!v.lastName.trim())    e.lastName    = 'Le nom est requis.';
  if (!v.email.trim())       e.email       = "L'email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "L'email est invalide.";
  if (!v.phoneNumber.trim()) e.phoneNumber = 'Le téléphone est requis.';
  else if (!/^\+?[0-9\s\-]{8,15}$/.test(v.phoneNumber)) e.phoneNumber = 'Format invalide. Ex : +237 6XX XXX XXX';
  if (!v.exerciceId)         e.exerciceId  = 'Veuillez sélectionner un exercice.';
  if (!v.matricule.trim())   e.matricule   = 'Le matricule est requis.';
  if (!v.roleSysteme)        e.roleSysteme = 'Veuillez sélectionner un rôle.';
  if (!v.sectionId)          e.sectionId   = 'Veuillez sélectionner une section.';
  if (!v.programmeIds || v.programmeIds.length === 0) e.programmeIds = 'Veuillez sélectionner au moins un programme.';
  if (!v.numeroCni.trim())   e.numeroCni   = 'Le numéro de CNI est requis.';
  if (!v.cniIssueDate)       e.cniIssueDate = "La date d'émission est requise.";
  if (!v.cniExpiryDate)      e.cniExpiryDate = "La date d'expiration est requise.";
  if (!v.password)           e.password = 'Le mot de passe est requis.';
  else if (v.password.length < 8)                       e.password = 'Au moins 8 caractères.';
  else if (!/(?=.*[A-Z])/.test(v.password))             e.password = 'Au moins une majuscule.';
  else if (!/(?=.*[a-z])/.test(v.password))             e.password = 'Au moins une minuscule.';
  else if (!/(?=.*\d)/.test(v.password))                e.password = 'Au moins un chiffre.';
  else if (!/(?=.*[^A-Za-z\d])/.test(v.password))       e.password = 'Au moins un caractère spécial.';
  if (!v.confirmPassword)    e.confirmPassword = 'Veuillez confirmer le mot de passe.';
  else if (v.password !== v.confirmPassword)             e.confirmPassword = 'Les mots de passe ne correspondent pas.';
  return e;
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [values,      setValues]      = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [apiError,    setApiError]    = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess,   setIsSuccess]   = useState(false);
  const [createdName, setCreatedName] = useState('');

  // Données de référence
  const [exercices,     setExercices]     = useState<SelectOption[]>([]);
  const [loadExercices, setLoadExercices] = useState(false);
  const [sections,      setSections]      = useState<SelectOption[]>([]);
  const [loadSections,  setLoadSections]  = useState(false);
  const [roles,         setRoles]         = useState<SelectOption[]>([]);
  const [loadRoles,     setLoadRoles]     = useState(false);
  const [programmes,    setProgrammes]    = useState<SelectOption[]>([]);
  const [loadProgrammes,setLoadProgrammes]= useState(false);
  const [actions,       setActions]       = useState<SelectOption[]>([]);
  const [loadActions,   setLoadActions]   = useState(false);

  const strength = passwordStrength(values.password);

  // Auth guard
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (!ctx) { clearTokens(); router.replace(APP_ROUTES.LOGIN); return; }
    const role = (ctx.affectations?.find(a => a.actif) ?? ctx.affectations?.[0])?.roleSysteme;
    if (role && role !== 'ADMIN') router.replace(APP_ROUTES.DASHBOARD);
  }, [router]);

  // ── Chargement initial : exercices + rôles ──
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    // Exercices
    setLoadExercices(true);
    fetch(REFERENTIEL_ENDPOINTS.EXERCICES, { headers })
      .then(r => r.json())
      .then((data: any[]) => {
        setExercices(
          (data ?? []).filter(x => x?.id != null).map(x => ({
            id:    String(x.id),
            label: [x.annee != null ? String(x.annee) : '', String(x.libelleFr ?? x.libelleEn ?? '').trim()].filter(Boolean).join(' - ') || String(x.id),
            code:  x.codeExercice != null ? String(x.codeExercice) : undefined,
          }))
        );
      })
      .catch(() => setExercices([]))
      .finally(() => setLoadExercices(false));

    // Rôles
    setLoadRoles(true);
    fetch(ADMIN_ENDPOINTS.USERS_ROLES, { headers })
      .then(r => r.json())
      .then((data: any[]) => {
        setRoles(
          (data ?? []).map((r: any) => {
            if (typeof r === 'string') return { id: r, label: r };
            const id    = String(r.roleSysteme ?? r.code ?? r.id ?? '');
            const label = String(r.libelle ?? r.label ?? r.roleSysteme ?? r.name ?? id);
            return { id, label };
          }).filter((x: any) => x?.id)
        );
      })
      .catch(() => setRoles([]))
      .finally(() => setLoadRoles(false));
  }, []);

  // ── CASCADE : Sections selon l'exercice ──
  const fetchSectionsByExercice = useCallback(async (exerciceId: string) => {
    if (!exerciceId) { setSections([]); return; }
    const token = getAccessToken();
    if (!token) return;

    setLoadSections(true);
    try {
      const response = await fetch(
        REFERENTIEL_ENDPOINTS.SECTIONS_BY_EXERCICE(exerciceId),
        { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
      );
      const data: any[] = await response.json();

      setSections(
        (data ?? []).filter(s => s?.id != null).map(s => ({
          id: String(s.id),
          // ✅ CORRECTION : le back-end retourne libelleFr + codeSection (pas libelle + code)
          label: String(s.libelleFr ?? s.libelleEn ?? s.libelle ?? s.sigle ?? s.id),
          code:  s.codeSection != null ? String(s.codeSection) : undefined,
        }))
      );
    } catch {
      setSections([]);
    } finally {
      setLoadSections(false);
    }
  }, []);

  // ── CASCADE : Programmes selon la section ──
  const fetchProgrammes = useCallback(async (sectionId: string) => {
    if (!sectionId) { setProgrammes([]); return; }
    const token = getAccessToken();
    if (!token) return;

    setLoadProgrammes(true);
    setValues(prev => ({ ...prev, programmeIds: [], actionIds: [] }));
    setActions([]);

    try {
      const response = await fetch(
        REFERENTIEL_ENDPOINTS.PROGRAMMES_BY_SECTION(sectionId),
        { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
      );
      const data: any[] = await response.json();

      setProgrammes(
        (data ?? []).filter(p => p?.id != null).map(p => ({
          id: String(p.id),
          // ✅ CORRECTION : libelleFr + codeProgramme
          label: String(p.libelleFr ?? p.libelleEn ?? p.libelle ?? p.id),
          code:  p.codeProgramme != null ? String(p.codeProgramme) : (p.code != null ? String(p.code) : undefined),
        }))
      );
    } catch {
      setProgrammes([]);
    } finally {
      setLoadProgrammes(false);
    }
  }, []);

  // ── CASCADE : Actions selon les programmes ──
  const fetchActions = useCallback(async (programmeIds: string[]) => {
    if (!programmeIds || programmeIds.length === 0) { setActions([]); return; }
    const token = getAccessToken();
    if (!token) return;

    setLoadActions(true);
    setValues(prev => ({ ...prev, actionIds: [] }));

    try {
      const tokenHeader = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const results = await Promise.all(
        programmeIds.map(async (programmeId) => {
          const response = await fetch(
            REFERENTIEL_ENDPOINTS.ACTIONS_BY_PROGRAMME(programmeId),
            { headers: tokenHeader }
          );
          const data: any[] = await response.json();
          return (data ?? []).filter(a => a?.id != null).map(a => ({
            id: String(a.id),
            // ✅ CORRECTION : libelleFr + codeAction
            label: String(a.libelleFr ?? a.libelleEn ?? a.libelle ?? a.id),
            code:  a.codeAction != null ? String(a.codeAction) : (a.code != null ? String(a.code) : undefined),
          }));
        })
      );

      // Fusion + déduplication par id
      const map = new Map<string, SelectOption>();
      results.flat().forEach(opt => map.set(opt.id, opt));
      setActions(Array.from(map.values()));
    } catch {
      setActions([]);
    } finally {
      setLoadActions(false);
    }
  }, []);

  // ── Handlers ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const handleExerciceChange = (exerciceId: string) => {
    setValues(prev => ({ ...prev, exerciceId, sectionId: '', programmeIds: [], actionIds: [] }));
    if (fieldErrors.exerciceId) setFieldErrors(prev => ({ ...prev, exerciceId: undefined }));
    setProgrammes([]);
    setActions([]);
    setSections([]);
    fetchSectionsByExercice(exerciceId);
  };

  const handleSectionChange = (sectionId: string) => {
    setValues(prev => ({ ...prev, sectionId, programmeIds: [], actionIds: [] }));
    if (fieldErrors.sectionId) setFieldErrors(prev => ({ ...prev, sectionId: undefined }));
    setActions([]);
    fetchProgrammes(sectionId);
  };

  const handleProgrammeIdsChange = (programmeIds: string[]) => {
    setValues(prev => ({ ...prev, programmeIds, actionIds: [] }));
    if (fieldErrors.programmeIds) setFieldErrors(prev => ({ ...prev, programmeIds: undefined }));
    fetchActions(programmeIds);
  };

  const handleRoleSystemeChange = (roleSysteme: string) => {
    setValues(prev => ({ ...prev, roleSysteme }));
    if (fieldErrors.roleSysteme) setFieldErrors(prev => ({ ...prev, roleSysteme: undefined }));
  };

  const handleActionsChange = (actionIds: string[]) => {
    setValues(prev => ({ ...prev, actionIds }));
  };

  // ── Soumission ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      document.getElementById(Object.keys(errors)[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsLoading(true);
    setApiError('');
    setFieldErrors({});

    try {
      const payload: AdminCreateUserPayload = {
        firstName:    values.firstName.trim(),
        lastName:     values.lastName.trim(),
        matricule:    values.matricule.trim(),
        email:        values.email.trim().toLowerCase(),
        phoneNumber:  values.phoneNumber.trim(),
        numeroCni:    values.numeroCni.trim(),
        nui:          values.nui.trim(),
        cniIssueDate: values.cniIssueDate,
        cniExpiryDate: values.cniExpiryDate,
        roleSysteme:  values.roleSysteme,
        sectionId:    values.sectionId,
        programmeIds: values.programmeIds,
        password:     values.password,
        ...(values.actionIds.length > 0 ? { actionIds: values.actionIds } : {}),
      };

      await createUser(payload);
      setCreatedName(`${values.firstName} ${values.lastName}`);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.httpStatus === 401) { clearTokens(); router.replace(APP_ROUTES.LOGIN); return; }
        if (Object.keys(err.fieldErrors).length > 0) setFieldErrors(err.fieldErrors);
        else setApiError(err.message);
      } else {
        setApiError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Écran de succès ──
  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.10)', animation: 'cardReveal .4s cubic-bezier(.22,.68,0,1.2)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #005A2D, #009A4E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(0,122,61,.3)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#0D2B55', marginBottom: 12 }}>Compte créé avec succès !</h2>
          <p style={{ fontSize: '.925rem', color: '#4A5568', lineHeight: 1.7, marginBottom: 8 }}>
            Le compte de <strong style={{ color: '#0D2B55' }}>{createdName}</strong> a été créé avec succès.
          </p>
          <p style={{ fontSize: '.875rem', color: '#8E9BAA', lineHeight: 1.6, marginBottom: 32 }}>
            L'utilisateur devra configurer son authentification à deux facteurs lors de sa première connexion.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setIsSuccess(false); setValues(EMPTY_FORM); setFieldErrors({}); setSections([]); setProgrammes([]); setActions([]); }}
              style={{ padding: '12px 24px', border: '1.5px solid #0D2B55', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 600, color: '#0D2B55' }}>
              + Créer un autre utilisateur
            </button>
            <button onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)}
              style={{ padding: '12px 24px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 600, color: '#fff', boxShadow: '0 4px 14px rgba(13,43,85,.25)' }}>
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Rendu du formulaire ──
  return (
    <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* TOPBAR */}
      <header style={{ background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(13,43,85,.30)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: '.82rem', fontWeight: 500, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <IconArrow /> Tableau de bord
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.2)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Créer un utilisateur</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 999, padding: '4px 14px 4px 4px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #CE1126, #8B0914)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.7rem', fontWeight: 700 }}>AD</div>
          <div><p style={{ fontSize: '.78rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>Administrateur</p><p style={{ fontSize: '.63rem', color: 'rgba(255,255,255,.5)' }}>Super Admin</p></div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
        <div style={{ background: '#007A3D' }}/><div style={{ background: '#CE1126' }}/><div style={{ background: '#FCD116' }}/>
      </div>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Fil d'Ariane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: '.78rem', color: '#8E9BAA' }}>
          <span onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)} style={{ cursor: 'pointer' }}>Tableau de bord</span>
          <span>›</span><span onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)} style={{ cursor: 'pointer' }}>Utilisateurs</span>
          <span>›</span><span style={{ color: '#0D2B55', fontWeight: 600 }}>Créer un utilisateur</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#0D2B55', marginBottom: 6 }}>Nouvel utilisateur</h2>
          <p style={{ fontSize: '.875rem', color: '#8E9BAA' }}>Remplissez les informations ci-dessous. Un email avec les identifiants sera envoyé à l'utilisateur.</p>
        </div>

        {apiError && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: '.875rem', marginBottom: 24 }}>
            <IconAlert /><span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── RUBRIQUE 1 — INFORMATIONS PERSONNELLES ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', overflow: 'visible', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '20px 24px 0' }}>
                <SectionHeader number={1} icon={<IconUser />} title="Informations personnelles" description="État civil de l'agent tel qu'il apparaît sur ses documents officiels" />
              </div>
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input id="firstName" name="firstName" label="Prénom *" placeholder="Ex : Jean-Baptiste"
                    value={values.firstName} onChange={handleChange} error={fieldErrors.firstName} icon={<IconUser />} disabled={isLoading} autoFocus />
                  <Input id="lastName" name="lastName" label="Nom de famille *" placeholder="Ex : Nguema"
                    value={values.lastName} onChange={handleChange} error={fieldErrors.lastName} icon={<IconUser />} disabled={isLoading} />
                </div>
                <Input id="email" name="email" type="email" label="Adresse email professionnelle *" placeholder="prenom.nom@minfi.cm"
                  value={values.email} onChange={handleChange} error={fieldErrors.email} icon={<IconMail />} disabled={isLoading} />
                <Input id="phoneNumber" name="phoneNumber" type="tel" label="Téléphone *" placeholder="+237 6XX XXX XXX"
                  value={values.phoneNumber} onChange={handleChange} error={fieldErrors.phoneNumber} icon={<IconPhone />} disabled={isLoading} />
              </div>
            </div>

            <SectionDivider />

            {/* ── RUBRIQUE 2 — INFORMATIONS PROFESSIONNELLES ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', overflow: 'visible', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '20px 24px 0' }}>
                <SectionHeader number={2} icon={<IconBuilding />} title="Informations professionnelles" description="Identifiants, affectation et rôle au sein de la Fonction Publique" />
              </div>
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Matricule + NUI */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input id="matricule" name="matricule" label="Matricule (Fonction Publique) *" placeholder="Ex : FP-23-456789"
                    value={values.matricule} onChange={handleChange} error={fieldErrors.matricule} icon={<IconBadge />} disabled={isLoading} />
                  <Input id="nui" name="nui" label="NUI (Identifiant Fiscal)" placeholder="Ex : P123456789"
                    value={values.nui} onChange={handleChange} error={fieldErrors.nui} icon={<IconBadge />} disabled={isLoading} />
                </div>

                {/* Rôle */}
                <div id="roleSysteme">
                  {loadRoles ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                      <IconSpinner /> Chargement des rôles…
                    </div>
                  ) : (
                    <SearchableSelect id="roleSysteme" label="Rôle dans l'application *" placeholder="Sélectionnez un rôle…"
                      options={roles} multiple={false} value={values.roleSysteme} onChange={handleRoleSystemeChange}
                      error={fieldErrors.roleSysteme} disabled={isLoading} icon={<IconRole />} />
                  )}
                </div>

                {/* Exercice → déclenche le chargement des sections */}
                <div id="exerciceId">
                  {loadExercices ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                      <IconSpinner /> Chargement des exercices…
                    </div>
                  ) : (
                    <SearchableSelect id="exerciceId" label="Exercice budgétaire *" placeholder="Sélectionnez un exercice…"
                      options={exercices} multiple={false} value={values.exerciceId} onChange={handleExerciceChange}
                      error={fieldErrors.exerciceId} disabled={isLoading} icon={<IconCalendar />} />
                  )}
                </div>

                {/* Section → visible après choix d'un exercice */}
                <div id="sectionId">
                  {loadSections ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                      <IconSpinner /> Chargement des sections…
                    </div>
                  ) : (
                    <SearchableSelect id="sectionId" label="Section administrative (Ministère / Direction) *"
                      placeholder={values.exerciceId ? 'Sélectionnez une section…' : 'Sélectionnez d\'abord un exercice'}
                      options={sections} multiple={false} value={values.sectionId} onChange={handleSectionChange}
                      error={fieldErrors.sectionId} disabled={isLoading || !values.exerciceId} icon={<IconBuilding />} />
                  )}
                </div>

                {/* Programmes → visible après choix d'une section */}
                {values.sectionId && (
                  <div id="programmeIds" style={{ animation: 'fadeSlideDown .2s ease' }}>
                    {loadProgrammes ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                        <IconSpinner /> Chargement des programmes de la section…
                      </div>
                    ) : programmes.length === 0 ? (
                      <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FCD116', borderRadius: 8, fontSize: '.8rem', color: '#92400E' }}>
                        ⚠️ Aucun programme disponible pour cette section.
                      </div>
                    ) : (
                      <SearchableSelect id="programmeIds" label="Programmes budgétaires *"
                        placeholder="Sélectionnez un ou plusieurs programmes…"
                        options={programmes} multiple={true} value={values.programmeIds} onChange={handleProgrammeIdsChange}
                        error={fieldErrors.programmeIds} disabled={isLoading} icon={<IconGrid />} />
                    )}
                  </div>
                )}

                {/* Actions → visible après choix de programmes */}
                {values.programmeIds.length > 0 && (
                  <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                    {loadActions ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', color: '#8E9BAA', fontSize: '.82rem' }}>
                        <IconSpinner /> Chargement des actions…
                      </div>
                    ) : actions.length === 0 ? (
                      <div style={{ padding: '10px 14px', background: '#F0F2F5', borderRadius: 8, fontSize: '.78rem', color: '#8E9BAA' }}>
                        ℹ️ Aucune action disponible pour ce(s) programme(s). (optionnel)
                      </div>
                    ) : (
                      <SearchableSelect id="actionIds" label="Actions (optionnel)"
                        placeholder="Sélectionnez les actions concernées…"
                        options={actions} multiple={true} value={values.actionIds} onChange={handleActionsChange}
                        disabled={isLoading} icon={<IconGrid />} />
                    )}
                  </div>
                )}
              </div>
            </div>

            <SectionDivider />

            {/* ── RUBRIQUE 3 — CNI ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '20px 24px 0' }}>
                <SectionHeader number={3} icon={<IconCard />} title="Carte Nationale d'Identité (CNI)" description="Informations figurant sur la CNI camerounaise en cours de validité" />
              </div>
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input id="numeroCni" name="numeroCni" label="Numéro de CNI *" placeholder="Ex : CN000000001"
                  value={values.numeroCni} onChange={handleChange} error={fieldErrors.numeroCni} icon={<IconCard />} disabled={isLoading} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input id="cniIssueDate" name="cniIssueDate" type="date" label="Date d'émission *"
                    value={values.cniIssueDate} onChange={handleChange} error={fieldErrors.cniIssueDate} icon={<IconCalendar />} disabled={isLoading} />
                  <Input id="cniExpiryDate" name="cniExpiryDate" type="date" label="Date d'expiration *"
                    value={values.cniExpiryDate} onChange={handleChange} error={fieldErrors.cniExpiryDate} icon={<IconCalendar />} disabled={isLoading} />
                </div>
              </div>
            </div>

            <SectionDivider />

            {/* ── RUBRIQUE 4 — MOT DE PASSE ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '20px 24px 0' }}>
                <SectionHeader number={4} icon={<IconLock />} title="Mot de passe temporaire" description="L'utilisateur devra le changer dès sa première connexion" />
              </div>
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Input id="password" name="password" type={showPwd ? 'text' : 'password'} label="Mot de passe *" placeholder="••••••••"
                    value={values.password} onChange={handleChange} error={fieldErrors.password} icon={<IconLock />} disabled={isLoading}
                    rightElement={
                      <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}>
                        {showPwd ? <IconEyeOff /> : <IconEye />}
                      </button>
                    } />
                  {values.password && (
                    <div style={{ marginTop: 6 }}>
                      <div className="pwd-strength">
                        {[1,2,3].map(i => <div key={i} className={`pwd-strength__bar ${strength >= i ? `pwd-strength__bar--${STRENGTH_MODS[strength]}` : ''}`} />)}
                      </div>
                      <p className="pwd-strength__label">Force : <strong style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</strong></p>
                    </div>
                  )}
                </div>
                <Input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} label="Confirmer le mot de passe *" placeholder="••••••••"
                  value={values.confirmPassword} onChange={handleChange} error={fieldErrors.confirmPassword} icon={<IconLock />} disabled={isLoading}
                  rightElement={
                    <button type="button" className="pwd-toggle" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                      {showConfirm ? <IconEyeOff /> : <IconEye />}
                    </button>
                  } />
                {/* Règles */}
                <div style={{ padding: '10px 14px', background: 'rgba(13,43,85,.03)', borderRadius: 8, border: '1px solid rgba(13,43,85,.08)' }}>
                  <p style={{ fontSize: '.73rem', fontWeight: 600, color: '#0D2B55', marginBottom: 6 }}>Le mot de passe doit contenir :</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
                    {[
                      { ok: values.password.length >= 8,           label: 'Au moins 8 caractères' },
                      { ok: /[A-Z]/.test(values.password),          label: 'Une majuscule (A-Z)' },
                      { ok: /[a-z]/.test(values.password),          label: 'Une minuscule (a-z)' },
                      { ok: /[0-9]/.test(values.password),          label: 'Un chiffre (0-9)' },
                      { ok: /[^A-Za-z0-9]/.test(values.password),   label: 'Un caractère spécial (!@#…)' },
                    ].map(rule => (
                      <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={rule.ok ? '#007A3D' : '#D1D8E0'} strokeWidth="2.5">
                          {rule.ok ? <polyline points="20,6 9,17 4,12"/> : <circle cx="12" cy="12" r="10"/>}
                        </svg>
                        <span style={{ fontSize: '.71rem', color: rule.ok ? '#007A3D' : '#8E9BAA', fontWeight: rule.ok ? 500 : 400 }}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── BOUTONS ── */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="button" onClick={() => router.push(APP_ROUTES.ADMIN_DASHBOARD)} disabled={isLoading}
                style={{ padding: '12px 24px', border: '1.5px solid #E8ECF0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 500, color: '#4A5568' }}>
                Annuler
              </button>
              <button type="submit" disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', border: 'none', borderRadius: 10, background: isLoading ? '#8E9BAA' : 'linear-gradient(135deg, #007A3D, #005A2D)', cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 600, color: '#fff', boxShadow: isLoading ? 'none' : '0 4px 14px rgba(0,122,61,.3)', transition: 'all .15s' }}>
                {isLoading ? <><IconSpinner /> Création en cours…</> : <><IconCheck /> Créer l&apos;utilisateur</>}
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}