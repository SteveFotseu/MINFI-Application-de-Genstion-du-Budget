'use client';

// ============================================================
// FICHIER  : src/app/admin/users/create/page.tsx
// RÔLE     : Création d'un utilisateur en 1 étape.
//
// FLUX :
//   1. Charger les agents sans compte  GET /admin/agents/without-account
//   2. Charger les rôles               GET /admin/users/roles
//   3. L'admin sélectionne un agent (prénom + nom + matricule)
//   4. L'admin remplit email, mot de passe, rôle, section, programme
//   5. POST /admin/users { agentId, email, password, roleSysteme, sectionId, programmeIds[] }
//
// NOTE SUR roleSysteme :
//   L'API /admin/users/roles retourne { code, libelle, defaultPermissions }.
//   Le champ "roleSysteme" attendu par POST /admin/users est le CODE (ex: "ORDONNATEUR"),
//   pas un ID numérique. Le back-end fait "Entity not found" si on envoie un ID inexistant.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS, REFERENTIEL_ENDPOINTS } from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// TRADUCTION DES CODES D'ERREUR BACK-END
// ─────────────────────────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  'VALIDATION.USER.EMAIL.NOT_BLANK':        'L\'adresse email est obligatoire.',
  'VALIDATION.USER.EMAIL.FORMAT':           'L\'adresse email n\'est pas valide.',
  'VALIDATION.USER.PASSWORD.NOT_BLANK':     'Le mot de passe est obligatoire.',
  'VALIDATION.USER.PASSWORD.SIZE':          'Le mot de passe doit contenir entre 8 et 72 caractères.',
  'VALIDATION.USER.PASSWORD.WEAK':          'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.',
  'VALIDATION.USER.ROLE.NOT_NULL':          'Veuillez sélectionner un rôle.',
  'VALIDATION.USER.SECTION.NOT_BLANK':      'Veuillez sélectionner une section.',
  'VALIDATION.USER.PROGRAMMES.NOT_EMPTY':   'Veuillez sélectionner au moins un programme.',
  'EMAIL_ALREADY_EXISTS':                   'Cette adresse email est déjà utilisée.',
  'PHONE_NUMBER_ALREADY_EXISTS':            'Ce numéro de téléphone est déjà utilisé.',
  'ENTITY_NOT_FOUND':                       'Ressource introuvable. Vérifiez votre sélection.',
  'USER_ALREADY_EXISTS_FOR_AGENT':          'Cet agent possède déjà un compte utilisateur.',
  'AGENT_NOT_FOUND':                        'Agent introuvable dans le système.',
  'ACCOUNT_ALREADY_ACTIVATED':              'Ce compte est déjà activé.',
  'ACCOUNT_ALREADY_DEACTIVATED':            'Ce compte est déjà désactivé.',
  'AFFECTATION_ALREADY_EXISTS':             'Cette affectation existe déjà pour cet agent.',
  'USER_NOT_FOUND':                         'Agent introuvable.',
};

const ERROR_FIELD_MAP: Record<string, string> = {
  'VALIDATION.USER.EMAIL.NOT_BLANK':  'email',
  'VALIDATION.USER.EMAIL.FORMAT':     'email',
  'EMAIL_ALREADY_EXISTS':             'email',
  'VALIDATION.USER.PASSWORD.NOT_BLANK': 'password',
  'VALIDATION.USER.PASSWORD.SIZE':      'password',
  'VALIDATION.USER.PASSWORD.WEAK':      'password',
  'VALIDATION.USER.ROLE.NOT_NULL':      'roleSysteme',
  'VALIDATION.USER.SECTION.NOT_BLANK':  'sectionId',
  'VALIDATION.USER.PROGRAMMES.NOT_EMPTY':'programmeId',
};

function translateError(code: string): string {
  return ERROR_MESSAGES[code] ?? `Erreur serveur : ${code}`;
}

function parseBackendError(data: Record<string, unknown>): { fieldErrors: Record<string, string>; generalError: string } {
  const fieldErrors: Record<string, string> = {};
  let generalError = '';
  if (Array.isArray(data.validationsErros)) {
    (data.validationsErros as { field?: string; code?: string; message?: string }[]).forEach(err => {
      const code  = err.code ?? err.message ?? '';
      const field = err.field ?? ERROR_FIELD_MAP[code] ?? '';
      const msg   = translateError(code);
      if (field) fieldErrors[field] = msg;
      else generalError = generalError ? `${generalError} — ${msg}` : msg;
    });
    return { fieldErrors, generalError };
  }
  if (data.code && typeof data.code === 'string') {
    const field = ERROR_FIELD_MAP[data.code];
    const msg   = translateError(data.code);
    if (field) fieldErrors[field] = msg;
    else generalError = msg;
    return { fieldErrors, generalError };
  }
  generalError = typeof data.message === 'string' ? data.message : 'Une erreur inattendue s\'est produite.';
  return { fieldErrors, generalError };
}

// ── Types ────────────────────────────────────────────────────
interface AgentWithoutAccount {
  id: string; firstName: string; lastName: string;
  matricule: string; phoneNumber: string; actif: boolean;
}
interface Role { code: string; libelle: string; defaultPermissions: string[]; }
interface Section { id: string; codeSection: string; sigle: string; libelleFr: string; }
interface Programme { id: string; code: string; libelleFr: string; }
type Errors = Record<string, string | undefined>;

// ── Icônes ───────────────────────────────────────────────────
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconCheck  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>;
const IconLogout = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconEye    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconAlertCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconFieldError  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconUser   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const Spinner = ({ size = 16, color = '#0D2B55' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: '2px solid rgba(0,0,0,.1)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite', flexShrink: 0 }} />
);

// ── Composants UI ────────────────────────────────────────────
function Field({ label, error, required, hint, children }: { label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#4A5568' }}>
        {label}{required && <span style={{ color: '#CE1126', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {!error && hint && <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 1 }}>{hint}</p>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, marginTop: 2, animation: 'fadeSlideDown .2s ease' }}>
          <span style={{ color: '#CE1126', flexShrink: 0, marginTop: 1 }}><IconFieldError /></span>
          <p style={{ fontSize: '.78rem', color: '#991B1B', lineHeight: 1.4 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, marginBottom: 20, animation: 'fadeSlideDown .25s ease' }}>
      <span style={{ color: '#CE1126', flexShrink: 0, marginTop: 2 }}><IconAlertCircle /></span>
      <div>
        <p style={{ fontWeight: 700, color: '#991B1B', fontSize: '.875rem', marginBottom: errors.length > 1 ? 6 : 0 }}>
          {errors.length > 1 ? `${errors.length} erreurs à corriger` : 'Une erreur s\'est produite'}
        </p>
        {errors.length > 1
          ? <ul style={{ margin: 0, paddingLeft: 16 }}>{errors.map((e, i) => <li key={i} style={{ fontSize: '.82rem', color: '#991B1B', lineHeight: 1.5 }}>{e}</li>)}</ul>
          : <p style={{ fontSize: '.82rem', color: '#991B1B' }}>{errors[0]}</p>}
      </div>
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%', height: 44, padding: '0 14px',
  border: `1.5px solid ${hasError ? '#CE1126' : '#E8ECF0'}`,
  borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '.875rem',
  color: '#1A202C', outline: 'none', background: hasError ? '#FFF5F5' : '#fff',
  transition: 'border-color .15s', boxShadow: hasError ? '0 0 0 3px rgba(206,17,38,.06)' : 'none',
});

const selectStyle = (hasError?: boolean): React.CSSProperties => ({
  ...inputStyle(hasError), cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E9BAA' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
});

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function CreateUserPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (!ctx || ctx.role !== 'ADMIN') router.replace(APP_ROUTES.DASHBOARD);
  }, [router]);

  // ── Données référentiel ──
  const [agents,      setAgents]      = useState<AgentWithoutAccount[]>([]);
  const [roles,       setRoles]       = useState<Role[]>([]);
  const [sections,    setSections]    = useState<Section[]>([]);
  const [programmes,  setProgrammes]  = useState<Programme[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingProg, setLoadingProg] = useState(false);

  // ── Formulaire ──
  const [form, setForm] = useState({
    agentId: '', email: '', password: '', confirmPassword: '',
    roleSysteme: '', sectionId: '', programmeId: '',
  });
  const [errors,       setErrors]       = useState<Errors>({});
  const [bannerErrors, setBannerErrors] = useState<string[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [showPwd,      setShowPwd]      = useState(false);
  const [showCfm,      setShowCfm]      = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 5000);
  };

  const authH = useCallback((): Record<string, string> => ({
    'Content-Type': 'application/json', 'Accept': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  }), []);

  // ── Charger agents sans compte + rôles + sections ──
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(ADMIN_ENDPOINTS.AGENTS_WITHOUT_ACCOUNT, { headers: authH() }).then(r => r.ok ? r.json() : []),
      fetch(ADMIN_ENDPOINTS.ROLES, { headers: authH() }).then(r => r.ok ? r.json() : []),
      fetch(REFERENTIEL_ENDPOINTS.SECTIONS, { headers: authH() }).then(r => r.ok ? r.json() : []),
    ]).then(([a, r, s]) => {
      setAgents(a);
      setRoles(r);
      setSections(s);
    }).catch(() => showToast('Impossible de charger les données.', 'error'))
      .finally(() => setLoading(false));
  }, [authH]);

  // ── Cascade programmes ──
  const handleSectionChange = async (sectionId: string) => {
    setForm(p => ({ ...p, sectionId, programmeId: '' }));
    setErrors(p => ({ ...p, sectionId: undefined, programmeId: undefined }));
    if (!sectionId) { setProgrammes([]); return; }
    setLoadingProg(true);
    try {
      const res = await fetch(REFERENTIEL_ENDPOINTS.PROGRAMMES_BY_SECTION(sectionId), { headers: authH() });
      setProgrammes(res.ok ? await res.json() : []);
    } catch { showToast('Impossible de charger les programmes.', 'error'); }
    finally { setLoadingProg(false); }
  };

  // ── Agent sélectionné (pour affichage) ──
  const selectedAgent = agents.find(a => a.id === form.agentId);
  const selectedRole  = roles.find(r => r.code === form.roleSysteme);

  // ── Validation locale ──
  function validate(): boolean {
    const e: Errors = {};
    if (!form.agentId)    e.agentId = 'Veuillez sélectionner un agent.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Adresse email valide obligatoire.';
    if (!form.password || form.password.length < 8)
      e.password = 'Minimum 8 caractères.';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(form.password))
      e.password = 'Doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas.';
    if (!form.roleSysteme) e.roleSysteme = 'Veuillez sélectionner un rôle.';
    if (!form.sectionId)   e.sectionId   = 'Veuillez sélectionner une section.';
    if (!form.programmeId) e.programmeId = 'Veuillez sélectionner un programme.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Soumettre ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerErrors([]);
    if (!validate()) {
      setBannerErrors(['Veuillez corriger les erreurs ci-dessous.']);
      return;
    }
    setSubmitting(true);
    try {
      // NOTE : roleSysteme = code du rôle (ex : "ORDONNATEUR"), pas un ID
      const payload = {
        agentId:      form.agentId,
        email:        form.email,
        password:     form.password,
        roleSysteme:  form.roleSysteme,  // code (ORDONNATEUR, ADMIN, etc.)
        sectionId:    form.sectionId,
        programmeIds: [form.programmeId],
      };
      const res  = await fetch(ADMIN_ENDPOINTS.CREATE_USER, {
        method: 'POST', headers: authH(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const { fieldErrors, generalError } = parseBackendError(data);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          setBannerErrors(Object.values(fieldErrors));
        } else {
          setBannerErrors([generalError || 'Une erreur est survenue.']);
        }
        return;
      }
      showToast('✓ Utilisateur créé avec succès !');
      setTimeout(() => router.push(APP_ROUTES.ADMIN_DASHBOARD), 1800);
    } catch {
      setBannerErrors(['Impossible de joindre le serveur. Vérifiez votre connexion.']);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof typeof form) => (val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined }));
    setBannerErrors([]);
  };

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
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)' }}>Administration</p>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>
          <Link href={APP_ROUTES.ADMIN_DASHBOARD} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)' }}>← Tableau de bord</span>
            </div>
          </Link>
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>
            <IconLogout /> Déconnexion
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="8" height="8" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></div>
          <div style={{ background: '#FCD116' }} />
        </div>
      </aside>

      {/* ════ CONTENU ════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <Link href={APP_ROUTES.ADMIN_DASHBOARD} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, textDecoration: 'none', fontSize: '.82rem', color: '#4A5568' }}>
            <IconArrowLeft /> Retour
          </Link>
          <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Créer un compte utilisateur</h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>Associer un agent existant à un compte d'accès GBE</p>
          </div>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="6" height="6" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></div>
          <div style={{ background: '#FCD116' }} />
        </div>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 720 }}>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 20px', color: '#8E9BAA' }}>
                <Spinner size={36} />
                <p>Chargement des données…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <ErrorBanner errors={bannerErrors} />

                {/* ── BLOC 1 : Sélection de l'agent ── */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <div style={stepBadge('#0D2B55')}><IconUser /></div>
                    <div>
                      <h2 style={cardTitle}>Agent à lier au compte</h2>
                      <p style={cardSub}>Sélectionnez l'agent qui possédera ce compte utilisateur</p>
                    </div>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <Field label="Agent" required error={errors.agentId}
                      hint={agents.length === 0 ? 'Aucun agent disponible — tous les agents ont déjà un compte.' : `${agents.length} agent(s) sans compte disponible(s)`}>
                      {agents.length === 0 ? (
                        <div style={{ height: 44, padding: '0 14px', border: '1.5px solid #FCD116', borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', color: '#92400E', fontSize: '.82rem' }}>
                          ⚠️ Aucun agent sans compte à associer
                        </div>
                      ) : (
                        <select style={selectStyle(!!errors.agentId)} value={form.agentId}
                          onChange={e => setField('agentId')(e.target.value)}>
                          <option value="">— Sélectionner un agent —</option>
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.firstName} {a.lastName} — Matricule : {a.matricule}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>

                    {/* Fiche de l'agent sélectionné */}
                    {selectedAgent && (
                      <div style={{ marginTop: 14, display: 'flex', gap: 14, padding: '14px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, animation: 'fadeSlideDown .2s ease' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0D2B55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>
                          {selectedAgent.firstName[0]}{selectedAgent.lastName[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#1D4ED8', fontSize: '.9rem' }}>
                            {selectedAgent.firstName} {selectedAgent.lastName}
                          </p>
                          <p style={{ fontSize: '.78rem', color: '#3B82F6', marginTop: 2 }}>
                            Matricule : {selectedAgent.matricule} &nbsp;·&nbsp; Tél : {selectedAgent.phoneNumber}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BLOC 2 : Identifiants de connexion ── */}
                <div style={{ ...cardStyle, marginTop: 20 }}>
                  <div style={cardHeaderStyle}>
                    <div style={stepBadge('#007A3D')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <h2 style={cardTitle}>Identifiants de connexion</h2>
                      <p style={cardSub}>Email et mot de passe temporaire pour la première connexion</p>
                    </div>
                  </div>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <Field label="Adresse email" required error={errors.email}>
                      <input type="email" style={inputStyle(!!errors.email)} placeholder="prenom.nom@minfi.cm"
                        value={form.email} onChange={e => setField('email')(e.target.value)} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Mot de passe temporaire" required error={errors.password}
                        hint="Majuscule + Minuscule + Chiffre + Caractère spécial">
                        <div style={{ position: 'relative' }}>
                          <input type={showPwd ? 'text' : 'password'} style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
                            placeholder="Ex : Temp@1234" value={form.password}
                            onChange={e => setField('password')(e.target.value)} />
                          <button type="button" onClick={() => setShowPwd(v => !v)} style={eyeBtn}>{showPwd ? <IconEyeOff /> : <IconEye />}</button>
                        </div>
                      </Field>
                      <Field label="Confirmer le mot de passe" required error={errors.confirmPassword}>
                        <div style={{ position: 'relative' }}>
                          <input type={showCfm ? 'text' : 'password'} style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: 44 }}
                            placeholder="Répéter le mot de passe" value={form.confirmPassword}
                            onChange={e => setField('confirmPassword')(e.target.value)} />
                          <button type="button" onClick={() => setShowCfm(v => !v)} style={eyeBtn}>{showCfm ? <IconEyeOff /> : <IconEye />}</button>
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── BLOC 3 : Rôle et affectation ── */}
                <div style={{ ...cardStyle, marginTop: 20 }}>
                  <div style={cardHeaderStyle}>
                    <div style={stepBadge('#7C3AED')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <h2 style={cardTitle}>Rôle et affectation budgétaire</h2>
                      <p style={cardSub}>Droits d'accès et programme budgétaire associé</p>
                    </div>
                  </div>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Rôle */}
                    <Field label="Rôle système" required error={errors.roleSysteme}>
                      <select style={selectStyle(!!errors.roleSysteme)} value={form.roleSysteme}
                        onChange={e => setField('roleSysteme')(e.target.value)}>
                        <option value="">— Sélectionner un rôle —</option>
                        {roles.map(r => (
                          <option key={r.code} value={r.code}>{r.libelle}</option>
                        ))}
                      </select>
                      {selectedRole && (
                        <div style={{ marginTop: 8, padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
                          <p style={{ fontSize: '.72rem', fontWeight: 600, color: '#1D4ED8', marginBottom: 6 }}>Permissions de ce rôle :</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {selectedRole.defaultPermissions.map(p => (
                              <span key={p} style={{ padding: '2px 8px', background: '#DBEAFE', color: '#1E40AF', borderRadius: 4, fontSize: '.68rem', fontWeight: 500 }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Field>

                    {/* Section */}
                    <Field label="Section (Ministère)" required error={errors.sectionId}>
                      <select style={selectStyle(!!errors.sectionId)} value={form.sectionId}
                        onChange={e => handleSectionChange(e.target.value)}>
                        <option value="">— Sélectionner une section —</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.sigle} — {s.libelleFr}</option>)}
                      </select>
                    </Field>

                    {/* Programme */}
                    {form.sectionId && (
                      <Field label="Programme budgétaire" required error={errors.programmeId}>
                        {loadingProg ? (
                          <div style={{ height: 44, padding: '0 14px', border: '1.5px solid #E8ECF0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#8E9BAA', fontSize: '.875rem' }}>
                            <Spinner size={14} /> Chargement des programmes…
                          </div>
                        ) : programmes.length === 0 ? (
                          <div style={{ height: 44, padding: '0 14px', border: '1.5px solid #FCD116', borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', color: '#92400E', fontSize: '.82rem' }}>
                            Aucun programme pour cette section
                          </div>
                        ) : (
                          <select style={selectStyle(!!errors.programmeId)} value={form.programmeId}
                            onChange={e => setField('programmeId')(e.target.value)}>
                            <option value="">— Sélectionner un programme —</option>
                            {programmes.map(p => <option key={p.id} value={p.id}>{p.libelleFr} ({p.code})</option>)}
                          </select>
                        )}
                      </Field>
                    )}

                  </div>
                </div>

                {/* ── Bouton soumettre ── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="submit" disabled={submitting || agents.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', border: 'none', borderRadius: 10, background: submitting ? '#8E9BAA' : 'linear-gradient(135deg, #007A3D, #005A2D)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.95rem', fontWeight: 700, boxShadow: submitting ? 'none' : '0 4px 16px rgba(0,122,61,.25)' }}>
                    {submitting
                      ? <><Spinner color="#fff" /> Création en cours…</>
                      : <><IconCheck /> Créer le compte utilisateur</>
                    }
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#0D2B55' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s ease', maxWidth: 440 }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Styles partagés ──────────────────────────────────────────
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { padding: '18px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', gap: 12 };
const cardTitle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' };
const cardSub:   React.CSSProperties = { fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 };
const stepBadge = (color: string): React.CSSProperties => ({ width: 34, height: 34, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 });
const eyeBtn:    React.CSSProperties = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8E9BAA', display: 'flex', padding: 0 };