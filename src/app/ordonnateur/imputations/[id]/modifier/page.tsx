'use client';

// ============================================================
// FICHIER  : src/app/ordonnateur/imputations/[id]/modifier/page.tsx
// RÔLE     : Modification d'une imputation existante.
//            Accessible uniquement si statut BROUILLON ou REJETEE.
//            Formulaire pré-rempli. Bouton brouillon sans restriction.
// ============================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

import SearchableSelect from '@/components/ui/SearchableSelect';
import type { SelectOption } from '@/components/ui/SearchableSelect';

import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';
import { genererCodeImputation } from '@/types/imputation';
import type { ImputationBudgetaire, ImputationFormErrors } from '@/types/imputation';

import {
  TYPES_DE_SERVICE, REGIONS_CAMEROUN, DIVISIONS_FONCTIONNELLES, TITRES_ECONOMIQUES,
  FAKE_PROGRAMMES, getGroupesByDivision, getClassesByGroupe, getArticlesByTitre,
  getParagraphesByArticle, getRubriquesByParagraphe, getDepartementsByRegion,
  getArrondissementsByDepartement, getNextCodeAction,
} from '@/data/nomenclatureBudgetaire';

const toOpts = (items: { code: string; libelle: string }[]): SelectOption[] =>
  items.map(i => ({ id: i.code, label: i.libelle, code: i.code }));
const toIdOpts = (items: { id: string; code: string; libelle: string }[]): SelectOption[] =>
  items.map(i => ({ id: i.id, label: i.libelle, code: i.code }));

// ─────────────────────────────────────────────────────────────
// ICÔNES
// ─────────────────────────────────────────────────────────────
const IconBack   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>);
const IconLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconCheck  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>);
const IconPlus   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IconX      = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconAlert  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconLock   = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconCode   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>);
const IconCopy   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);

const Spinner = ({ size = 14, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(255,255,255,.2)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

const labelSt: React.CSSProperties = { display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#4A5568', marginBottom: 6 };
function ErrMsg({ msg }: { msg: string }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#CE1126', marginTop: 5 }}>
      <IconAlert /> {msg}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
export default function ModifierImputationPage() {
  const router  = useRouter();
  const { id }  = useParams<{ id: string }>();

  const [imp,      setImp]      = useState<ImputationBudgetaire | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Contexte
  const [codeExercice, setCodeExercice] = useState('');
  const [codeSection,  setCodeSection]  = useState('');
  const [sectionLib,   setSectionLib]   = useState('');
  const [exerciceLib,  setExerciceLib]  = useState('');

  // Champs formulaire
  const [libelle,        setLibelle]        = useState('');
  const [programmeId,    setProgrammeId]    = useState('');
  const [actionId,       setActionId]       = useState('');
  const [actionOptions,  setActionOptions]  = useState<SelectOption[]>([]);
  const [showAddAction,  setShowAddAction]  = useState(false);
  const [newActionLabel, setNewActionLabel] = useState('');
  const [addingAction,   setAddingAction]   = useState(false);
  const [localActions,   setLocalActions]   = useState<{ id: string; code: string; libelle: string; programmeId: string }[]>([]);

  const [codeTypeService,  setCodeTypeService]  = useState('');
  const [codeRegion,       setCodeRegion]        = useState('');
  const [codeDepartement,  setCodeDepartement]   = useState('');
  const [codeLocalisation, setCodeLocalisation]  = useState('');
  const [numeroOrdre,      setNumeroOrdre]        = useState('');
  const [deptOptions,      setDeptOptions]       = useState<SelectOption[]>([]);
  const [arrtOptions,      setArrtOptions]       = useState<SelectOption[]>([]);

  const [codeDivision, setCodeDivision] = useState('');
  const [codeGroupe,   setCodeGroupe]   = useState('');
  const [codeClasse,   setCodeClasse]   = useState('');
  const [groupeOpts,   setGroupeOpts]   = useState<SelectOption[]>([]);
  const [classeOpts,   setClasseOpts]   = useState<SelectOption[]>([]);

  const [codeTitre,      setCodeTitre]      = useState('');
  const [codeArticle,    setCodeArticle]    = useState('');
  const [codeParagraphe, setCodeParagraphe] = useState('');
  const [codeRubrique,   setCodeRubrique]   = useState('');
  const [articleOpts,    setArticleOpts]    = useState<SelectOption[]>([]);
  const [paraOpts,       setParaOpts]       = useState<SelectOption[]>([]);
  const [rubOpts,        setRubOpts]        = useState<SelectOption[]>([]);

  const [errors,       setErrors]       = useState<ImputationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  // ── Guard ──
  useEffect(() => {
    if (!getAccessToken()) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx  = getUserContext();
    const aff  = ctx?.affectations?.find(a => a.actif) ?? ctx?.affectations?.[0];
    if (!aff?.roleSysteme?.startsWith('ORDONNATEUR')) { router.replace(APP_ROUTES.DASHBOARD); return; }
    const annee = new Date().getFullYear();
    setCodeExercice(String(47 + (annee - 2013)));
    setCodeSection(aff.sectionId);
    setSectionLib(aff.sectionLibelle);
    setExerciceLib(String(annee));
  }, [router]);

  // ── Chargement + pré-remplissage ──
  useEffect(() => {
    const raw  = localStorage.getItem('gbe_imputations');
    const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
    const found = all.find(i => i.id === id);

    if (!found) { setNotFound(true); setLoading(false); return; }
    if (found.statut !== 'BROUILLON' && found.statut !== 'REJETEE') {
      router.replace(APP_ROUTES.ORD_IMPUTATION_DETAIL(id)); return;
    }

    setImp(found);
    setLibelle(found.libelle);
    setProgrammeId(found.programme.id);
    const prog = FAKE_PROGRAMMES.find(p => p.id === found.programme.id);
    setActionOptions((prog?.actions ?? []).map(a => ({ id: a.id, label: a.libelle, code: a.code })));
    setActionId(found.action.id);
    setCodeTypeService(found.typeService.code);

    // Cascade géographique
    const locCode = found.localisation.code;
    outer: for (const reg of REGIONS_CAMEROUN) {
      for (const dep of reg.departements) {
        if (dep.arrondissements.some(a => a.code === locCode)) {
          setCodeRegion(reg.code);
          setCodeDepartement(dep.code);
          setDeptOptions(getDepartementsByRegion(reg.code).map(d => ({ id: d.code, label: d.libelle, code: d.code })));
          setArrtOptions(getArrondissementsByDepartement(reg.code, dep.code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
          break outer;
        }
      }
    }
    setCodeLocalisation(locCode);
    setNumeroOrdre(found.numeroOrdre);

    // Fonctionnelle
    setCodeDivision(found.division.code);
    setGroupeOpts(getGroupesByDivision(found.division.code).map(g => ({ id: g.code, label: g.libelle, code: g.code })));
    setCodeGroupe(found.groupe.code);
    setClasseOpts(getClassesByGroupe(found.division.code, found.groupe.code).map(c => ({ id: c.code, label: c.libelle, code: c.code })));
    setCodeClasse(found.classe.code);

    // Économique
    setCodeTitre(found.titre.code);
    setArticleOpts(getArticlesByTitre(found.titre.code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
    setCodeArticle(found.article.code);
    setParaOpts(getParagraphesByArticle(found.titre.code, found.article.code).map(p => ({ id: p.code, label: p.libelle, code: p.code })));
    setCodeParagraphe(found.paragraphe.code);
    setRubOpts(getRubriquesByParagraphe(found.titre.code, found.article.code, found.paragraphe.code).map(r => ({ id: r.code, label: r.libelle, code: r.code })));
    setCodeRubrique(found.rubrique.code);

    setLoading(false);
  }, [id, router]);

  // ── Dérivés ──
  const programme  = FAKE_PROGRAMMES.find(p => p.id === programmeId);
  const allActions = [...(programme?.actions ?? []), ...localActions.filter(a => a.programmeId === programmeId)];
  const action     = allActions.find(a => a.id === actionId);
  const typeService  = TYPES_DE_SERVICE.find(t => t.code === codeTypeService);
  const localisation = REGIONS_CAMEROUN.flatMap(r => r.departements.flatMap(d => d.arrondissements)).find(a => a.code === codeLocalisation);
  const division   = DIVISIONS_FONCTIONNELLES.find(d => d.code === codeDivision);
  const groupe     = division?.groupes.find(g => g.code === codeGroupe);
  const classe     = groupe?.classes.find(c => c.code === codeClasse);
  const titre      = TITRES_ECONOMIQUES.find(t => t.code === codeTitre);
  const article    = titre?.articles.find(a => a.code === codeArticle);
  const paragraphe = article?.paragraphes.find(p => p.code === codeParagraphe);
  const rubrique   = paragraphe?.rubriques.find(r => r.code === codeRubrique);

  const champsRemplis = [codeExercice, codeSection, programmeId, actionId, codeTypeService, codeLocalisation, numeroOrdre, codeDivision, codeGroupe, codeClasse, codeTitre, codeArticle, codeParagraphe, codeRubrique].filter(Boolean).length;
  const progression   = Math.round((champsRemplis / 13) * 100);
  const isComplete    = champsRemplis === 13 && !!libelle.trim();

  // ── Handlers cascade ──
  const handleProgrammeChange = (pid: string) => {
    setProgrammeId(pid); setActionId('');
    const prog = FAKE_PROGRAMMES.find(p => p.id === pid);
    setActionOptions([...(prog?.actions ?? []), ...localActions.filter(a => a.programmeId === pid)].map(a => ({ id: a.id, label: a.libelle, code: a.code })));
    setErrors(prev => ({ ...prev, programmeId: undefined, actionId: undefined }));
  };

  const handleCreateAction = async () => {
    if (!newActionLabel.trim()) return;
    setAddingAction(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const existing = [...(programme?.actions ?? []), ...localActions.filter(a => a.programmeId === programmeId)];
      const newCode  = getNextCodeAction(existing);
      const newAct   = { id: `local-${Date.now()}`, code: newCode, libelle: newActionLabel.trim(), programmeId };
      setLocalActions(prev => [...prev, newAct]);
      setActionOptions(prev => [...prev, { id: newAct.id, label: newAct.libelle, code: newAct.code }]);
      setActionId(newAct.id);
      setNewActionLabel(''); setShowAddAction(false);
      showToast(`Action "${newAct.libelle}" créée (code ${newCode}).`);
    } finally { setAddingAction(false); }
  };

  const handleRegionChange = (code: string) => {
    setCodeRegion(code); setCodeDepartement(''); setCodeLocalisation('');
    setDeptOptions(getDepartementsByRegion(code).map(d => ({ id: d.code, label: d.libelle, code: d.code })));
    setArrtOptions([]);
  };
  const handleDeptChange = (code: string) => {
    setCodeDepartement(code); setCodeLocalisation('');
    setArrtOptions(getArrondissementsByDepartement(codeRegion, code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
  };
  const handleDivisionChange = (code: string) => {
    setCodeDivision(code); setCodeGroupe(''); setCodeClasse('');
    setGroupeOpts(getGroupesByDivision(code).map(g => ({ id: g.code, label: g.libelle, code: g.code }))); setClasseOpts([]);
  };
  const handleGroupeChange = (code: string) => {
    setCodeGroupe(code); setCodeClasse('');
    setClasseOpts(getClassesByGroupe(codeDivision, code).map(c => ({ id: c.code, label: c.libelle, code: c.code })));
  };
  const handleTitreChange = (code: string) => {
    setCodeTitre(code); setCodeArticle(''); setCodeParagraphe(''); setCodeRubrique('');
    setArticleOpts(getArticlesByTitre(code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
    setParaOpts([]); setRubOpts([]);
  };
  const handleArticleChange = (code: string) => {
    setCodeArticle(code); setCodeParagraphe(''); setCodeRubrique('');
    setParaOpts(getParagraphesByArticle(codeTitre, code).map(p => ({ id: p.code, label: p.libelle, code: p.code }))); setRubOpts([]);
  };
  const handleParaChange = (code: string) => {
    setCodeParagraphe(code); setCodeRubrique('');
    setRubOpts(getRubriquesByParagraphe(codeTitre, codeArticle, code).map(r => ({ id: r.code, label: r.libelle, code: r.code })));
  };

  const handleCopy = () => {
    const code = genererCodeImputation({ codeExercice, codeSection, codeProgramme: programme?.code, codeAction: action?.code, codeTypeService, codeLocalisation, numeroOrdre, codeDivision, codeGroupe, codeClasse, codeTitre, codeArticle, codeParagraphe, codeRubrique });
    navigator.clipboard.writeText(code.replace(/_/g, '')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  // ── Validation ──
  const validate = (): ImputationFormErrors => ({
    ...(!libelle.trim()   && { libelle:          'Le libellé est obligatoire.' }),
    ...(!programmeId      && { programmeId:      'Sélectionnez un programme.' }),
    ...(!actionId         && { actionId:         'Sélectionnez ou créez une action.' }),
    ...(!codeTypeService  && { codeTypeService:  'Sélectionnez un type de service.' }),
    ...(!codeLocalisation && { codeLocalisation: 'Sélectionnez un arrondissement.' }),
    ...(!numeroOrdre      && { numeroOrdre:      "Sélectionnez un numéro d'ordre." }),
    ...(!codeDivision     && { codeDivision:     'Sélectionnez une division.' }),
    ...(!codeGroupe       && { codeGroupe:       'Sélectionnez un groupe.' }),
    ...(!codeClasse       && { codeClasse:       'Sélectionnez une classe.' }),
    ...(!codeTitre        && { codeTitre:        'Sélectionnez un titre.' }),
    ...(!codeArticle      && { codeArticle:      'Sélectionnez un article.' }),
    ...(!codeParagraphe   && { codeParagraphe:   'Sélectionnez un paragraphe.' }),
    ...(!codeRubrique     && { codeRubrique:     'Sélectionnez une rubrique.' }),
  });

  // ── Sauvegarde ──
  const handleSave = async (statut: 'BROUILLON' | 'EN_ATTENTE') => {
    if (statut === 'EN_ATTENTE') {
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }
    } else {
      if (!libelle.trim()) {
        showToast('Ajoutez au moins un libellé pour sauvegarder.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      const raw  = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      const idx  = all.findIndex(i => i.id === id);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          statut,
          libelle: libelle.trim(),
          programme: programme ? { id: programme.id, code: programme.code, libelle: programme.libelle, actions: programme.actions } : all[idx].programme,
          action:    action    ? { id: action.id,    code: action.code,    libelle: action.libelle,    programmeId: programme?.id ?? '' } : all[idx].action,
          typeService:  typeService  ?? all[idx].typeService,
          localisation: localisation ?? all[idx].localisation,
          numeroOrdre:  numeroOrdre  || all[idx].numeroOrdre,
          division:   division   ? { code: division.code,   libelle: division.libelle,   groupes: [] } : all[idx].division,
          groupe:     groupe     ? { code: groupe.code,     libelle: groupe.libelle,     classes: [] } : all[idx].groupe,
          classe:     classe     ? { code: classe.code,     libelle: classe.libelle }                  : all[idx].classe,
          titre:      titre      ? { code: titre.code,      libelle: titre.libelle,      articles: [] } : all[idx].titre,
          article:    article    ? { code: article.code,    libelle: article.libelle,    paragraphes: [] } : all[idx].article,
          paragraphe: paragraphe ? { code: paragraphe.code, libelle: paragraphe.libelle, rubriques: [] } : all[idx].paragraphe,
          rubrique:   rubrique   ? { code: rubrique.code,   libelle: rubrique.libelle }                 : all[idx].rubrique,
          motifRejet: statut === 'EN_ATTENTE' ? undefined : all[idx].motifRejet,
          updatedAt:  new Date().toISOString(),
        };
        localStorage.setItem('gbe_imputations', JSON.stringify(all));
      }
      showToast(statut === 'BROUILLON' ? 'Modifications sauvegardées.' : 'Imputation soumise au CF.');
      setTimeout(() => router.push(APP_ROUTES.ORD_IMPUTATION_DETAIL(id)), 1000);
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}><Spinner size={40} color="#0D2B55" /></div>);
  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 10 }}>Imputation introuvable</p>
        <Link href={APP_ROUTES.ORD_IMPUTATIONS} style={{ color: '#007A3D', fontSize: '.875rem' }}>← Retour à la liste</Link>
      </div>
    </div>
  );

  const ordreOptions: SelectOption[] = ['01','02','03','04','05'].map(v => ({ id: v, label: `N° ${v}`, code: v }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, flexShrink: 0, background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 50 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)' }}>Espace Ordonnateur</p>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ label: 'Tableau de bord', href: APP_ROUTES.ORD_PRINCIPAL_DASHBOARD }, { label: 'Imputations', href: APP_ROUTES.ORD_IMPUTATIONS }].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '10px 12px', borderRadius: 8 }}>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)' }}>{item.label}</span>
              </div>
            </Link>
          ))}
          {progression > 0 && (
            <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8 }}>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Progression</p>
              <div style={{ height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progression}%`, background: progression === 100 ? '#22C55E' : '#FCD116', borderRadius: 4, transition: 'width .4s' }} />
              </div>
              <p style={{ fontSize: '.72rem', color: progression === 100 ? '#86EFAC' : '#FCD116', marginTop: 5, fontWeight: 600 }}>{progression}%</p>
            </div>
          )}
          {imp?.statut === 'REJETEE' && imp.motifRejet && (
            <div style={{ margin: '12px 8px 0', padding: '12px', background: 'rgba(206,17,38,.12)', borderRadius: 8, border: '1px solid rgba(206,17,38,.2)' }}>
              <p style={{ fontSize: '.65rem', color: '#FCA5A5', marginBottom: 4, fontWeight: 600 }}>Motif du rejet</p>
              <p style={{ fontSize: '.75rem', color: '#FCA5A5', lineHeight: 1.5 }}>{imp.motifRejet}</p>
            </div>
          )}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>
            <IconLogout /> Déconnexion
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }}/>
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          </div>
          <div style={{ background: '#FCD116' }}/>
        </div>
      </aside>

      {/* CONTENU */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <button onClick={() => router.push(APP_ROUTES.ORD_IMPUTATION_DETAIL(id))} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
            <IconBack /> Retour
          </button>
          <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>Modifier l'imputation</h1>
            <p style={{ fontSize: '.72rem', color: imp?.statut === 'REJETEE' ? '#CE1126' : '#8E9BAA', marginTop: 2 }}>
              {imp?.statut === 'REJETEE' ? '⚠️ Rejetée — Corrigez et soumettez à nouveau' : 'Brouillon en cours de modification'}
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }}/>
          <div style={{ background: '#CE1126' }}/>
          <div style={{ background: '#FCD116' }}/>
        </div>

        <main style={{ flex: 1, padding: '28px 32px 120px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* FORMULAIRE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Bloc A */}
              <Bloc num={1} titre="Identité budgétaire" done={true}>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ReadOnly label="Exercice" value={exerciceLib} badge={codeExercice} />
                  <ReadOnly label="Section" value={sectionLib} badge={codeSection} />
                </div>
              </Bloc>

              {/* Bloc B */}
              <Bloc num={2} titre="Objet de la dépense" done={!!libelle.trim()}>
                <div style={{ padding: '16px' }}>
                  <label style={labelSt}>Libellé *</label>
                  <textarea value={libelle} onChange={e => { setLibelle(e.target.value); setErrors(prev => ({ ...prev, libelle: undefined })); }} rows={3}
                    style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${errors.libelle ? '#CE1126' : '#E8ECF0'}`, borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#1A202C', resize: 'vertical', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#0D2B55'}
                    onBlur={e  => e.target.style.borderColor = errors.libelle ? '#CE1126' : '#E8ECF0'}
                  />
                  {errors.libelle && <ErrMsg msg={errors.libelle} />}
                </div>
              </Bloc>

              {/* Bloc C */}
              <Bloc num={3} titre="Classification programmatique" done={!!programmeId && !!actionId}>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <SearchableSelect id="prog" label="Programme *" placeholder="Programme…" options={toIdOpts(FAKE_PROGRAMMES)} multiple={false} value={programmeId} onChange={handleProgrammeChange} />
                    {errors.programmeId && <ErrMsg msg={errors.programmeId} />}
                  </div>
                  {programmeId && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={labelSt}>Action *</label>
                        <button type="button" onClick={() => setShowAddAction(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#007A3D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>
                          <IconPlus /> Créer une action
                        </button>
                      </div>
                      {showAddAction && (
                        <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" value={newActionLabel} onChange={e => setNewActionLabel(e.target.value)} placeholder="Libellé de l'action…" onKeyDown={e => { if (e.key === 'Enter') handleCreateAction(); }} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #BBF7D0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.875rem', outline: 'none' }} />
                            <button type="button" onClick={handleCreateAction} disabled={!newActionLabel.trim() || addingAction} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', borderRadius: 8, background: '#007A3D', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600 }}>
                              {addingAction ? <Spinner size={13} /> : <IconCheck />} Créer
                            </button>
                            <button type="button" onClick={() => { setShowAddAction(false); setNewActionLabel(''); }} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#8E9BAA' }}><IconX /></button>
                          </div>
                        </div>
                      )}
                      <SearchableSelect id="action" label="" placeholder="Action…" options={actionOptions} multiple={false} value={actionId} onChange={v => { setActionId(v); setErrors(prev => ({ ...prev, actionId: undefined })); }} />
                      {errors.actionId && <ErrMsg msg={errors.actionId} />}
                    </div>
                  )}
                </div>
              </Bloc>

              {/* Bloc D */}
              <Bloc num={4} titre="Chapitre (unité administrative)" done={!!codeTypeService && !!codeLocalisation && !!numeroOrdre}>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <SearchableSelect id="ts" label="Type de service *" placeholder="Type de service…" options={toOpts(TYPES_DE_SERVICE)} multiple={false} value={codeTypeService} onChange={v => { setCodeTypeService(v); setErrors(prev => ({ ...prev, codeTypeService: undefined })); }} />
                    {errors.codeTypeService && <ErrMsg msg={errors.codeTypeService} />}
                  </div>
                  <div>
                    <label style={{ ...labelSt, marginBottom: 8 }}>Localisation *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <SearchableSelect id="reg" label="Région" placeholder="Région…" options={REGIONS_CAMEROUN.map(r => ({ id: r.code, label: r.libelle, code: r.code }))} multiple={false} value={codeRegion} onChange={handleRegionChange} />
                      <SearchableSelect id="dep" label="Département" placeholder="Département…" options={deptOptions} multiple={false} value={codeDepartement} onChange={handleDeptChange} disabled={!codeRegion} />
                      <SearchableSelect id="arr" label="Arrondissement" placeholder="Arrondissement…" options={arrtOptions} multiple={false} value={codeLocalisation} onChange={v => { setCodeLocalisation(v); setErrors(prev => ({ ...prev, codeLocalisation: undefined })); }} disabled={!codeDepartement} />
                    </div>
                    {errors.codeLocalisation && <ErrMsg msg={errors.codeLocalisation} />}
                  </div>
                  <div>
                    <SearchableSelect id="ord" label="N° d'ordre *" placeholder="N° d'ordre…" options={ordreOptions} multiple={false} value={numeroOrdre} onChange={v => { setNumeroOrdre(v); setErrors(prev => ({ ...prev, numeroOrdre: undefined })); }} />
                    {errors.numeroOrdre && <ErrMsg msg={errors.numeroOrdre} />}
                  </div>
                </div>
              </Bloc>

              {/* Bloc E */}
              <Bloc num={5} titre="Classification fonctionnelle" done={!!codeDivision && !!codeGroupe && !!codeClasse}>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <SearchableSelect id="div" label="Division *" placeholder="Division…" options={DIVISIONS_FONCTIONNELLES.map(d => ({ id: d.code, label: d.libelle, code: d.code }))} multiple={false} value={codeDivision} onChange={handleDivisionChange} />
                    {errors.codeDivision && <ErrMsg msg={errors.codeDivision} />}
                  </div>
                  {codeDivision && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <SearchableSelect id="grp" label="Groupe *" placeholder="Groupe…" options={groupeOpts} multiple={false} value={codeGroupe} onChange={handleGroupeChange} />
                        {errors.codeGroupe && <ErrMsg msg={errors.codeGroupe} />}
                      </div>
                      <div>
                        <SearchableSelect id="cl" label="Classe *" placeholder="Classe…" options={classeOpts} multiple={false} value={codeClasse} onChange={v => { setCodeClasse(v); setErrors(prev => ({ ...prev, codeClasse: undefined })); }} disabled={!codeGroupe} />
                        {errors.codeClasse && <ErrMsg msg={errors.codeClasse} />}
                      </div>
                    </div>
                  )}
                </div>
              </Bloc>

              {/* Bloc F */}
              <Bloc num={6} titre="Classification économique" done={!!codeTitre && !!codeArticle && !!codeParagraphe && !!codeRubrique}>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <SearchableSelect id="tit" label="Titre *" placeholder="Titre…" options={TITRES_ECONOMIQUES.map(t => ({ id: t.code, label: t.libelle, code: t.code }))} multiple={false} value={codeTitre} onChange={handleTitreChange} />
                    {errors.codeTitre && <ErrMsg msg={errors.codeTitre} />}
                  </div>
                  {codeTitre && (
                    <div>
                      <SearchableSelect id="art" label="Article *" placeholder="Article…" options={articleOpts} multiple={false} value={codeArticle} onChange={handleArticleChange} />
                      {errors.codeArticle && <ErrMsg msg={errors.codeArticle} />}
                    </div>
                  )}
                  {codeArticle && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <SearchableSelect id="par" label="Paragraphe *" placeholder="Paragraphe…" options={paraOpts} multiple={false} value={codeParagraphe} onChange={handleParaChange} />
                        {errors.codeParagraphe && <ErrMsg msg={errors.codeParagraphe} />}
                      </div>
                      <div>
                        <SearchableSelect id="rub" label="Rubrique *" placeholder="Rubrique…" options={rubOpts} multiple={false} value={codeRubrique} onChange={v => { setCodeRubrique(v); setErrors(prev => ({ ...prev, codeRubrique: undefined })); }} disabled={!codeParagraphe} />
                        {errors.codeRubrique && <ErrMsg msg={errors.codeRubrique} />}
                      </div>
                    </div>
                  )}
                </div>
              </Bloc>
            </div>

            {/* CODE LIVE */}
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0D2B55', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(13,43,85,.25)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><IconCode /><p style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff' }}>Code d'imputation</p></div>
                  <button onClick={handleCopy} disabled={!isComplete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, background: 'rgba(255,255,255,.08)', cursor: isComplete ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', fontSize: '.72rem', color: '#fff', opacity: isComplete ? 1 : .4 }}>
                    {copied ? <><IconCheck /> Copié</> : <><IconCopy /> Copier</>}
                  </button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  {[
                    { label: 'Exo',  val: codeExercice    || '__',  color: '#8E9BAA', done: !!codeExercice },
                    { label: 'Sec',  val: codeSection     || '__',  color: '#8E9BAA', done: !!codeSection  },
                    { label: 'Prog', val: programme?.code || '___', color: '#378ADD', done: !!programmeId  },
                    { label: 'Act',  val: action?.code    || '_',   color: '#378ADD', done: !!actionId     },
                    { label: 'TSvc', val: codeTypeService || '__',  color: '#7C3AED', done: !!codeTypeService },
                    { label: 'Loc',  val: codeLocalisation|| '____',color: '#7C3AED', done: !!codeLocalisation },
                    { label: 'Ord',  val: numeroOrdre     || '__',  color: '#7C3AED', done: !!numeroOrdre  },
                    { label: 'Div',  val: codeDivision    || '__',  color: '#1D9E75', done: !!codeDivision },
                    { label: 'Grp',  val: codeGroupe      || '_',   color: '#1D9E75', done: !!codeGroupe   },
                    { label: 'Cl',   val: codeClasse      || '_',   color: '#1D9E75', done: !!codeClasse   },
                    { label: 'Tit',  val: codeTitre       || '_',   color: '#EF9F27', done: !!codeTitre    },
                    { label: 'Art',  val: codeArticle     || '__',  color: '#EF9F27', done: !!codeArticle  },
                    { label: 'Par',  val: codeParagraphe  || '_',   color: '#EF9F27', done: !!codeParagraphe },
                    { label: 'Rub',  val: codeRubrique    || '__',  color: '#EF9F27', done: !!codeRubrique },
                  ].map((seg, i, arr) => (
                    <React.Fragment key={i}>
                      <div style={{ display: 'inline-block', textAlign: 'center', margin: '0 2px 6px' }}>
                        <p style={{ fontSize: '.58rem', color: seg.done ? seg.color : 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{seg.label}</p>
                        <code style={{ display: 'block', padding: '3px 6px', borderRadius: 4, background: seg.done ? `${seg.color}20` : 'rgba(255,255,255,.04)', border: `1px solid ${seg.done ? `${seg.color}40` : 'rgba(255,255,255,.08)'}`, fontFamily: 'monospace', fontSize: '.75rem', fontWeight: 700, color: seg.done ? seg.color : 'rgba(255,255,255,.2)', letterSpacing: '.08em', transition: 'all .3s' }}>
                          {seg.val}
                        </code>
                      </div>
                      {i < arr.length - 1 && <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.15)', verticalAlign: 'bottom', lineHeight: '2.4em' }}> · </span>}
                    </React.Fragment>
                  ))}
                  <div style={{ height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden', marginTop: 12, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${progression}%`, background: progression === 100 ? '#22C55E' : '#FCD116', borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                  <p style={{ fontSize: '.7rem', color: progression === 100 ? '#86EFAC' : 'rgba(255,255,255,.4)', textAlign: 'center' }}>
                    {progression === 100 ? '✓ Code complet' : `${champsRemplis} / 13`}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
                  <div style={{ background: '#007A3D' }}/>
                  <div style={{ background: '#CE1126' }}/>
                  <div style={{ background: '#FCD116' }}/>
                </div>
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => handleSave('EN_ATTENTE')} disabled={isSubmitting || !isComplete} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', border: 'none', borderRadius: 10, background: isComplete && !isSubmitting ? 'linear-gradient(135deg, #007A3D, #005A2D)' : '#8E9BAA', cursor: isComplete && !isSubmitting ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 700, color: '#fff', boxShadow: isComplete && !isSubmitting ? '0 4px 16px rgba(0,122,61,.3)' : 'none' }}>
                  {isSubmitting ? <><Spinner size={15} /> Envoi…</> : <><IconCheck /> Soumettre au CF</>}
                </button>
                <button onClick={() => handleSave('BROUILLON')} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '11px', border: '1.5px solid #E8ECF0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 500, color: '#4A5568' }}>
                  Sauvegarder en brouillon
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#0D2B55' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s ease' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// Micro-composants
function Bloc({ num, titre, done, children }: { num: number; titre: string; done: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', boxShadow: '0 2px 12px rgba(0,0,0,.05)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #E8ECF0' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#007A3D' : '#0D2B55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 700, flexShrink: 0, transition: 'background .3s' }}>
          {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg> : num}
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '.88rem', fontWeight: 700, color: '#0D2B55' }}>{titre}</p>
      </div>
      {children}
    </div>
  );
}

function ReadOnly({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.8rem', fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>
        <span style={{ color: '#8E9BAA' }}><IconLock /></span> {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#F8F9FB', border: '1.5px solid #E8ECF0', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        {badge && <code style={{ padding: '2px 7px', background: '#E8ECF0', borderRadius: 4, fontSize: '.75rem', color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>{badge}</code>}
      </div>
    </div>
  );
}