'use client';

// ============================================================
// FICHIER  : src/app/admin/agents/create/page.tsx
// ROUTE    : /admin/agents/create
// RÔLE     : Création d'un nouvel agent (sans compte utilisateur).
//
// PAYLOAD ATTENDU PAR LE BACKEND :
//   POST /api/v1/admin/agents
//   {
//     "firstName":     "Mbarga",
//     "lastName":      "Anicet",
//     "dateOfBirth":   "AAAA-MM-DD",
//     "matricule":     "12345678N",
//     "nui":           "NUI123456",
//     "numeroCni":     "CN123456789",
//     "cniIssueDate":  "AAAA-MM-DD",
//     "cniExpiryDate": "AAAA-MM-DD",
//     "phoneNumber":   "+237612345678"
//   }
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAccessToken, getUserContext } from '@/lib/authService';
import { APP_ROUTES, ADMIN_ENDPOINTS } from '@/constants/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

// ── Traduction des erreurs back-end ──────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  'VALIDATION.AGENT.FIRSTNAME.NOT_BLANK': 'Le prénom est obligatoire.',
  'VALIDATION.AGENT.LASTNAME.NOT_BLANK':  'Le nom est obligatoire.',
  'VALIDATION.AGENT.MATRICULE.NOT_BLANK': 'Le matricule est obligatoire.',
  'VALIDATION.AGENT.NUI.NOT_BLANK':       'Le NUI est obligatoire.',
  'VALIDATION.AGENT.CNI.NOT_BLANK':       'Le numéro de CNI est obligatoire.',
  'VALIDATION.AGENT.PHONE.NOT_BLANK':     'Le numéro de téléphone est obligatoire.',
  'VALIDATION.AGENT.PHONE.FORMAT':        'Format de téléphone invalide.',
  'MATRICULE_ALREADY_EXISTS':             'Ce matricule est déjà utilisé.',
  'NUI_ALREADY_EXISTS':                   'Ce NUI est déjà utilisé.',
  'CNI_ALREADY_EXISTS':                   'Ce numéro de CNI est déjà utilisé.',
  'PHONE_NUMBER_ALREADY_EXISTS':          'Ce numéro de téléphone est déjà utilisé.',
};

const ERROR_FIELD_MAP: Record<string, string> = {
  'VALIDATION.AGENT.FIRSTNAME.NOT_BLANK': 'firstName',
  'VALIDATION.AGENT.LASTNAME.NOT_BLANK':  'lastName',
  'VALIDATION.AGENT.MATRICULE.NOT_BLANK': 'matricule',
  'MATRICULE_ALREADY_EXISTS':             'matricule',
  'VALIDATION.AGENT.NUI.NOT_BLANK':       'nui',
  'NUI_ALREADY_EXISTS':                   'nui',
  'VALIDATION.AGENT.CNI.NOT_BLANK':       'numeroCni',
  'CNI_ALREADY_EXISTS':                   'numeroCni',
  'VALIDATION.AGENT.PHONE.NOT_BLANK':     'phoneNumber',
  'VALIDATION.AGENT.PHONE.FORMAT':        'phoneNumber',
  'PHONE_NUMBER_ALREADY_EXISTS':          'phoneNumber',
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
type Errors = Record<string, string | undefined>;

// ── Icônes ───────────────────────────────────────────────────
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>;
const IconCheck     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>;
const IconAlertCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconFieldError  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconUser      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconID        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>;
const IconPhone     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>;

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

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function CreateAgentPage() {
  const router = useRouter();

  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    if (!ctx || ctx.role !== 'ADMIN') { router.replace(APP_ROUTES.DASHBOARD); return; }
    setAdminName(`${ctx.firstName} ${ctx.lastName}`);
  }, [router]);

  // ── État du formulaire ──
  const [form, setForm] = useState({
    firstName:     '',
    lastName:      '',
    dateOfBirth:   '',
    matricule:     '',
    nui:           '',
    numeroCni:     '',
    cniIssueDate:  '',
    cniExpiryDate: '',
    phoneNumber:   '',
  });
  const [errors,       setErrors]       = useState<Errors>({});
  const [bannerErrors, setBannerErrors] = useState<string[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 5000);
  };

  const authH = useCallback((): Record<string, string> => ({
    'Content-Type': 'application/json', 'Accept': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  }), []);

  // ── Validation locale ──
  function validate(): boolean {
    const e: Errors = {};
    const today = new Date().toISOString().slice(0, 10);

    if (!form.firstName.trim() || form.firstName.trim().length < 2)
      e.firstName = 'Prénom obligatoire (min. 2 caractères).';
    if (!form.lastName.trim() || form.lastName.trim().length < 2)
      e.lastName = 'Nom obligatoire (min. 2 caractères).';

    if (!form.dateOfBirth) {
      e.dateOfBirth = 'Date de naissance obligatoire.';
    } else if (form.dateOfBirth >= today) {
      e.dateOfBirth = 'La date de naissance doit être dans le passé.';
    } else {
      // Âge ≥ 18 ans
      const birth = new Date(form.dateOfBirth);
      const age   = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) e.dateOfBirth = 'L\'agent doit avoir au moins 18 ans.';
    }

    if (!form.matricule.trim()) e.matricule = 'Matricule obligatoire.';
    if (!form.nui.trim())       e.nui       = 'NUI obligatoire.';
    if (!form.numeroCni.trim()) e.numeroCni = 'Numéro de CNI obligatoire.';

    if (!form.cniIssueDate) {
      e.cniIssueDate = 'Date d\'émission obligatoire.';
    } else if (form.cniIssueDate > today) {
      e.cniIssueDate = 'La date d\'émission ne peut pas être future.';
    }

    if (!form.cniExpiryDate) {
      e.cniExpiryDate = 'Date d\'expiration obligatoire.';
    } else if (form.cniIssueDate && form.cniExpiryDate <= form.cniIssueDate) {
      e.cniExpiryDate = 'La date d\'expiration doit être après la date d\'émission.';
    }

    if (!form.phoneNumber.trim()) {
      e.phoneNumber = 'Numéro de téléphone obligatoire.';
    } else if (!/^\+237[2-9]\d{8}$/.test(form.phoneNumber.replace(/\s/g, ''))) {
      e.phoneNumber = 'Format attendu : +237 suivi de 9 chiffres (ex : +237612345678).';
    }

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
      const payload = {
        firstName:     form.firstName.trim(),
        lastName:      form.lastName.trim(),
        dateOfBirth:   form.dateOfBirth,
        matricule:     form.matricule.trim(),
        nui:           form.nui.trim(),
        numeroCni:     form.numeroCni.trim(),
        cniIssueDate:  form.cniIssueDate,
        cniExpiryDate: form.cniExpiryDate,
        phoneNumber:   form.phoneNumber.replace(/\s/g, ''),
      };
      const res  = await fetch(ADMIN_ENDPOINTS.CREATE_AGENT, {
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
      showToast('✓ Agent créé avec succès !');
      setTimeout(() => router.push(APP_ROUTES.ADMIN_AGENTS), 1500);
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

      <AdminSidebar active="agents" adminName={adminName} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <Link href={APP_ROUTES.ADMIN_AGENTS} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, textDecoration: 'none', fontSize: '.82rem', color: '#4A5568' }}>
            <IconArrowLeft /> Retour
          </Link>
          <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Créer un nouvel agent</h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>Enregistrer un agent administratif dans le système GBE</p>
          </div>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }} />
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="6" height="6" viewBox="0 0 24 24"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></div>
          <div style={{ background: '#FCD116' }} />
        </div>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 720 }}>
            <form onSubmit={handleSubmit} noValidate>
              <ErrorBanner errors={bannerErrors} />

              {/* ── BLOC 1 : Identité ── */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={stepBadge('#0D2B55')}><IconUser /></div>
                  <div>
                    <h2 style={cardTitle}>Identité de l&apos;agent</h2>
                    <p style={cardSub}>Informations personnelles de base</p>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Prénom" required error={errors.firstName}>
                      <input type="text" style={inputStyle(!!errors.firstName)} placeholder="Ex : Mbarga"
                        value={form.firstName} onChange={e => setField('firstName')(e.target.value)} />
                    </Field>
                    <Field label="Nom" required error={errors.lastName}>
                      <input type="text" style={inputStyle(!!errors.lastName)} placeholder="Ex : Anicet"
                        value={form.lastName} onChange={e => setField('lastName')(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Date de naissance" required error={errors.dateOfBirth}>
                    <input type="date" style={inputStyle(!!errors.dateOfBirth)}
                      value={form.dateOfBirth} onChange={e => setField('dateOfBirth')(e.target.value)} />
                  </Field>
                </div>
              </div>

              {/* ── BLOC 2 : Documents officiels ── */}
              <div style={{ ...cardStyle, marginTop: 20 }}>
                <div style={cardHeaderStyle}>
                  <div style={stepBadge('#7C3AED')}><IconID /></div>
                  <div>
                    <h2 style={cardTitle}>Documents officiels</h2>
                    <p style={cardSub}>Matricule, NUI et Carte Nationale d&apos;Identité</p>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Matricule" required error={errors.matricule}
                      hint="Identifiant administratif unique">
                      <input type="text" style={inputStyle(!!errors.matricule)} placeholder="Ex : 12345678N"
                        value={form.matricule} onChange={e => setField('matricule')(e.target.value)} />
                    </Field>
                    <Field label="NUI" required error={errors.nui}
                      hint="Numéro d'Identification Unique">
                      <input type="text" style={inputStyle(!!errors.nui)} placeholder="Ex : NUI123456"
                        value={form.nui} onChange={e => setField('nui')(e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Numéro de CNI" required error={errors.numeroCni}>
                    <input type="text" style={inputStyle(!!errors.numeroCni)} placeholder="Ex : CN123456789"
                      value={form.numeroCni} onChange={e => setField('numeroCni')(e.target.value)} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Date d&apos;émission de la CNI" required error={errors.cniIssueDate}>
                      <input type="date" style={inputStyle(!!errors.cniIssueDate)}
                        value={form.cniIssueDate} onChange={e => setField('cniIssueDate')(e.target.value)} />
                    </Field>
                    <Field label="Date d&apos;expiration de la CNI" required error={errors.cniExpiryDate}>
                      <input type="date" style={inputStyle(!!errors.cniExpiryDate)}
                        value={form.cniExpiryDate} onChange={e => setField('cniExpiryDate')(e.target.value)} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* ── BLOC 3 : Contact ── */}
              <div style={{ ...cardStyle, marginTop: 20 }}>
                <div style={cardHeaderStyle}>
                  <div style={stepBadge('#007A3D')}><IconPhone /></div>
                  <div>
                    <h2 style={cardTitle}>Coordonnées</h2>
                    <p style={cardSub}>Moyens de contact de l&apos;agent</p>
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  <Field label="Numéro de téléphone" required error={errors.phoneNumber}
                    hint="Format international, commence par +237">
                    <input type="tel" style={inputStyle(!!errors.phoneNumber)} placeholder="+237612345678"
                      value={form.phoneNumber} onChange={e => setField('phoneNumber')(e.target.value)} />
                  </Field>
                </div>
              </div>

              {/* ── Bouton soumettre ── */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="submit" disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', border: 'none', borderRadius: 10, background: submitting ? '#8E9BAA' : 'linear-gradient(135deg, #007A3D, #005A2D)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.95rem', fontWeight: 700, boxShadow: submitting ? 'none' : '0 4px 16px rgba(0,122,61,.25)' }}>
                  {submitting
                    ? <><Spinner color="#fff" /> Création en cours…</>
                    : <><IconCheck /> Enregistrer l&apos;agent</>
                  }
                </button>
              </div>
            </form>
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

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { padding: '18px 24px', borderBottom: '1px solid #E8ECF0', display: 'flex', alignItems: 'center', gap: 12 };
const cardTitle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55' };
const cardSub:   React.CSSProperties = { fontSize: '.75rem', color: '#8E9BAA', marginTop: 2 };
const stepBadge = (color: string): React.CSSProperties => ({ width: 34, height: 34, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 });