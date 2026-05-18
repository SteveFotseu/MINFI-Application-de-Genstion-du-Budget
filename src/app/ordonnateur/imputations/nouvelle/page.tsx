'use client';

// ============================================================
// FICHIER  : src/app/ordonnateur/imputations/nouvelle/page.tsx
// RÔLE     : Formulaire de création d'une imputation budgétaire.
//
// STRUCTURE (6 blocs progressifs) :
//   A — Identité          : Exercice + Section (auto, lecture seule)
//   B — Objet             : Libellé de la dépense (saisie libre)
//   C — Programmatique    : Programme + Action (+ créer action)
//   D — Chapitre          : Type service + Région→Dpt→Arrt + N° ordre
//   E — Fonctionnelle     : Division → Groupe → Classe
//   F — Économique        : Titre → Article → Paragraphe → Rubrique
//
// CODE GÉNÉRÉ EN TEMPS RÉEL : visible en permanence en bas de page.
// Il se remplit progressivement à chaque sélection.
//
// SAUVEGARDE : localStorage en attendant le back-end.
//              Dès que les routes API sont prêtes, remplacer
//              handleSave() par un fetch(IMPUTATION_ENDPOINTS.BASE).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import SearchableSelect  from '@/components/ui/SearchableSelect';
import type { SelectOption } from '@/components/ui/SearchableSelect';

import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES }   from '@/constants/auth';
import { genererCodeImputation } from '@/types/imputation';
import type {
  ImputationBudgetaire,
  ImputationFormErrors,
} from '@/types/imputation';

import {
  TYPES_DE_SERVICE,
  REGIONS_CAMEROUN,
  DIVISIONS_FONCTIONNELLES,
  TITRES_ECONOMIQUES,
  FAKE_PROGRAMMES,
  getGroupesByDivision,
  getClassesByGroupe,
  getArticlesByTitre,
  getParagraphesByArticle,
  getRubriquesByParagraphe,
  getDepartementsByRegion,
  getArrondissementsByDepartement,
  getNextCodeAction,
} from '@/data/nomenclatureBudgetaire';

// ─────────────────────────────────────────────────────────────
// HELPERS : conversion des données en SelectOption
// ─────────────────────────────────────────────────────────────
const toOptions = (items: { code: string; libelle: string }[]): SelectOption[] =>
  items.map(i => ({ id: i.code, label: i.libelle, code: i.code }));

const toIdOptions = (items: { id: string; code: string; libelle: string }[]): SelectOption[] =>
  items.map(i => ({ id: i.id, label: i.libelle, code: i.code }));

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG INLINE
// ─────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconCode = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const Spinner = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <span style={{
    display: 'inline-block', width: size, height: size, flexShrink: 0,
    border: '2px solid rgba(255,255,255,.25)', borderTopColor: color,
    borderRadius: '50%', animation: 'spin .65s linear infinite',
  }} />
);

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : EN-TÊTE DE BLOC
// ─────────────────────────────────────────────────────────────
interface BlocHeaderProps {
  numero: number;
  titre:  string;
  desc:   string;
  color:  string;
  done:   boolean;
}
const BlocHeader = ({ numero, titre, desc, color, done }: BlocHeaderProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #E8ECF0' }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: done ? '#007A3D' : color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: '.8rem', fontWeight: 700,
      transition: 'background .3s',
    }}>
      {done ? <IconCheck /> : numero}
    </div>
    <div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>{titre}</p>
      <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>{desc}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function NouvelleImputationPage() {
  const router = useRouter();

  // ── Contexte utilisateur ──
  const [userCtx, setUserCtx] = useState<{
    firstName: string; lastName: string;
    codeExercice: string; codeSection: string;
    sectionLibelle: string; exerciceLibelle: string;
  } | null>(null);

  // ── Bloc A — identité (auto) ──
  const codeExercice = userCtx?.codeExercice ?? '';
  const codeSection  = userCtx?.codeSection  ?? '';

  // ── Bloc B — objet ──
  const [libelle, setLibelle] = useState('');

  // ── Bloc C — Classification programmatique ──
  const [programmeId,  setProgrammeId]  = useState('');
  const [actionId,     setActionId]     = useState('');
  const [actions,      setActions]      = useState<SelectOption[]>([]);
  // Modal création d'action
  const [showAddAction,  setShowAddAction]  = useState(false);
  const [newActionLabel, setNewActionLabel] = useState('');
  const [addingAction,   setAddingAction]   = useState(false);
  const [localActions,   setLocalActions]   = useState<{ id: string; code: string; libelle: string; programmeId: string }[]>([]);

  // ── Bloc D — Chapitre ──
  const [codeTypeService,  setCodeTypeService]  = useState('');
  const [codeRegion,       setCodeRegion]        = useState('');
  const [codeDepartement,  setCodeDepartement]   = useState('');
  const [codeLocalisation, setCodeLocalisation]  = useState('');
  const [numeroOrdre,      setNumeroOrdre]        = useState('');
  // Listes dérivées
  const [departements,     setDepartements]      = useState<SelectOption[]>([]);
  const [arrondissements,  setArrondissements]   = useState<SelectOption[]>([]);
  // Options N° d'ordre (simulées séquentielles)
  const ordreOptions: SelectOption[] = [
    { id: '01', label: 'N° 01', code: '01' },
    { id: '02', label: 'N° 02', code: '02' },
    { id: '03', label: 'N° 03', code: '03' },
    { id: '04', label: 'N° 04', code: '04' },
    { id: '05', label: 'N° 05', code: '05' },
  ];

  // ── Bloc E — Classification fonctionnelle ──
  const [codeDivision, setCodeDivision] = useState('');
  const [codeGroupe,   setCodeGroupe]   = useState('');
  const [codeClasse,   setCodeClasse]   = useState('');
  const [groupes,      setGroupes]      = useState<SelectOption[]>([]);
  const [classes,      setClasses]      = useState<SelectOption[]>([]);

  // ── Bloc F — Classification économique ──
  const [codeTitre,      setCodeTitre]      = useState('');
  const [codeArticle,    setCodeArticle]    = useState('');
  const [codeParagraphe, setCodeParagraphe] = useState('');
  const [codeRubrique,   setCodeRubrique]   = useState('');
  const [articles,     setArticles]     = useState<SelectOption[]>([]);
  const [paragraphes,  setParagraphes]  = useState<SelectOption[]>([]);
  const [rubriques,    setRubriques]    = useState<SelectOption[]>([]);

  // ── UI ──
  const [errors,      setErrors]      = useState<ImputationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // GUARD & INIT CONTEXTE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.replace(APP_ROUTES.LOGIN); return; }

    const ctx = getUserContext();
    if (!ctx) { router.replace(APP_ROUTES.LOGIN); return; }

    const aff = ctx.affectations?.find(a => a.actif) ?? ctx.affectations?.[0];
    if (!aff?.roleSysteme?.startsWith('ORDONNATEUR')) {
      router.replace(APP_ROUTES.DASHBOARD); return;
    }

    // Calcul du code exercice : base 2013 = 47, +1 par an
    const annee       = new Date().getFullYear();
    const codeExo     = String(47 + (annee - 2013));
    const codeSection = aff.sectionId ?? '20';

    setUserCtx({
      firstName:       ctx.firstName,
      lastName:        ctx.lastName,
      codeExercice:    codeExo,
      codeSection,
      sectionLibelle:  aff.sectionLibelle ?? '',
      exerciceLibelle: String(annee),
    });
  }, [router]);

  // ─────────────────────────────────────────────────────────────
  // CODE D'IMPUTATION GÉNÉRÉ EN TEMPS RÉEL
  // ─────────────────────────────────────────────────────────────
  const programme = FAKE_PROGRAMMES.find(p => p.id === programmeId);
  const allActions = [...(programme?.actions ?? []), ...localActions.filter(a => a.programmeId === programmeId)];
  const action = allActions.find(a => a.id === actionId);

  const typeService  = TYPES_DE_SERVICE.find(t => t.code === codeTypeService);
  const localisation = REGIONS_CAMEROUN
    .flatMap(r => r.departements.flatMap(d => d.arrondissements))
    .find(a => a.code === codeLocalisation);

  const division  = DIVISIONS_FONCTIONNELLES.find(d => d.code === codeDivision);
  const groupe    = division?.groupes.find(g => g.code === codeGroupe);
  const classe    = groupe?.classes.find(c => c.code === codeClasse);
  const titre     = TITRES_ECONOMIQUES.find(t => t.code === codeTitre);
  const article   = titre?.articles.find(a => a.code === codeArticle);
  const paragraphe = article?.paragraphes.find(p => p.code === codeParagraphe);
  const rubrique  = paragraphe?.rubriques.find(r => r.code === codeRubrique);

  const codeImputation = genererCodeImputation({
    codeExercice,
    codeSection,
    codeProgramme:   programme?.code,
    codeAction:      action?.code,
    codeTypeService,
    codeLocalisation,
    numeroOrdre,
    codeDivision,
    codeGroupe,
    codeClasse,
    codeTitre,
    codeArticle,
    codeParagraphe,
    codeRubrique,
  });

  // Progression du remplissage (pour l'indicateur visuel)
  const totalChamps    = 13;
  const champsRemplis  = [
    codeExercice, codeSection, programmeId, actionId,
    codeTypeService, codeLocalisation, numeroOrdre,
    codeDivision, codeGroupe, codeClasse,
    codeTitre, codeArticle, codeParagraphe, codeRubrique,
  ].filter(Boolean).length;
  const progression    = Math.round((champsRemplis / totalChamps) * 100);
  const isComplete     = champsRemplis === totalChamps && !!libelle.trim();

  // ─────────────────────────────────────────────────────────────
  // HANDLERS CASCADE — Bloc C
  // ─────────────────────────────────────────────────────────────
  const handleProgrammeChange = useCallback((id: string) => {
    setProgrammeId(id);
    setActionId('');
    const prog = FAKE_PROGRAMMES.find(p => p.id === id);
    const allActs = [
      ...(prog?.actions ?? []),
      ...localActions.filter(a => a.programmeId === id),
    ];
    setActions(allActs.map(a => ({ id: a.id, label: a.libelle, code: a.code })));
    setErrors(prev => ({ ...prev, programmeId: undefined, actionId: undefined }));
  }, [localActions]);

  // Créer une nouvelle action
  const handleCreateAction = async () => {
    if (!newActionLabel.trim()) return;
    setAddingAction(true);
    try {
      // TODO: fetch(REFERENTIEL_ENDPOINTS.CREATE_ACTION(programmeId), { method: 'POST', body: { libelle: newActionLabel } })
      await new Promise(r => setTimeout(r, 400));

      const existingCodes = [
        ...(programme?.actions ?? []),
        ...localActions.filter(a => a.programmeId === programmeId),
      ];
      const newCode = getNextCodeAction(existingCodes);
      const newAct  = {
        id:          `local-${Date.now()}`,
        code:        newCode,
        libelle:     newActionLabel.trim(),
        programmeId,
      };
      setLocalActions(prev => [...prev, newAct]);
      setActions(prev => [...prev, { id: newAct.id, label: newAct.libelle, code: newAct.code }]);
      setActionId(newAct.id);
      setNewActionLabel('');
      setShowAddAction(false);
      showToast(`Action "${newAct.libelle}" créée (code ${newCode}).`);
    } finally {
      setAddingAction(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS CASCADE — Bloc D (Chapitre)
  // ─────────────────────────────────────────────────────────────
  const handleRegionChange = (code: string) => {
    setCodeRegion(code);
    setCodeDepartement('');
    setCodeLocalisation('');
    setDepartements(getDepartementsByRegion(code).map(d => ({ id: d.code, label: d.libelle, code: d.code })));
    setArrondissements([]);
  };

  const handleDepartementChange = (code: string) => {
    setCodeDepartement(code);
    setCodeLocalisation('');
    setArrondissements(getArrondissementsByDepartement(codeRegion, code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS CASCADE — Bloc E (Fonctionnelle)
  // ─────────────────────────────────────────────────────────────
  const handleDivisionChange = (code: string) => {
    setCodeDivision(code);
    setCodeGroupe('');
    setCodeClasse('');
    setGroupes(getGroupesByDivision(code).map(g => ({ id: g.code, label: g.libelle, code: g.code })));
    setClasses([]);
  };

  const handleGroupeChange = (code: string) => {
    setCodeGroupe(code);
    setCodeClasse('');
    setClasses(getClassesByGroupe(codeDivision, code).map(c => ({ id: c.code, label: c.libelle, code: c.code })));
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS CASCADE — Bloc F (Économique)
  // ─────────────────────────────────────────────────────────────
  const handleTitreChange = (code: string) => {
    setCodeTitre(code);
    setCodeArticle('');
    setCodeParagraphe('');
    setCodeRubrique('');
    setArticles(getArticlesByTitre(code).map(a => ({ id: a.code, label: a.libelle, code: a.code })));
    setParagraphes([]);
    setRubriques([]);
  };

  const handleArticleChange = (code: string) => {
    setCodeArticle(code);
    setCodeParagraphe('');
    setCodeRubrique('');
    setParagraphes(getParagraphesByArticle(codeTitre, code).map(p => ({ id: p.code, label: p.libelle, code: p.code })));
    setRubriques([]);
  };

  const handleParagrapheChange = (code: string) => {
    setCodeParagraphe(code);
    setCodeRubrique('');
    setRubriques(getRubriquesByParagraphe(codeTitre, codeArticle, code).map(r => ({ id: r.code, label: r.libelle, code: r.code })));
  };

  // ─────────────────────────────────────────────────────────────
  // COPIER LE CODE
  // ─────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(codeImputation.replace(/_/g, '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // ─────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────
  const validate = (): ImputationFormErrors => {
    const e: ImputationFormErrors = {};
    if (!libelle.trim())       e.libelle          = 'Le libellé est obligatoire.';
    if (!programmeId)          e.programmeId      = 'Sélectionnez un programme.';
    if (!actionId)             e.actionId         = 'Sélectionnez ou créez une action.';
    if (!codeTypeService)      e.codeTypeService  = 'Sélectionnez un type de service.';
    if (!codeLocalisation)     e.codeLocalisation = 'Sélectionnez un arrondissement.';
    if (!numeroOrdre)          e.numeroOrdre      = 'Sélectionnez un numéro d\'ordre.';
    if (!codeDivision)         e.codeDivision     = 'Sélectionnez une division.';
    if (!codeGroupe)           e.codeGroupe       = 'Sélectionnez un groupe.';
    if (!codeClasse)           e.codeClasse       = 'Sélectionnez une classe.';
    if (!codeTitre)            e.codeTitre        = 'Sélectionnez un titre.';
    if (!codeArticle)          e.codeArticle      = 'Sélectionnez un article.';
    if (!codeParagraphe)       e.codeParagraphe   = 'Sélectionnez un paragraphe.';
    if (!codeRubrique)         e.codeRubrique     = 'Sélectionnez une rubrique.';
    return e;
  };

  // ─────────────────────────────────────────────────────────────
  // SAUVEGARDE (localStorage en attendant l'API)
  // ─────────────────────────────────────────────────────────────
  const handleSave = async (statut: 'BROUILLON' | 'EN_ATTENTE') => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll vers le premier champ en erreur
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: remplacer par :
      // const res = await fetch(IMPUTATION_ENDPOINTS.BASE, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...payload, statut }),
      // });
      await new Promise(r => setTimeout(r, 700));

      const newImputation: ImputationBudgetaire = {
        id:        `imp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statut,
        createurId: 'current-user',
        libelle:   libelle.trim(),
        codeExercice,
        codeSection,
        programme: { id: programme!.id, code: programme!.code, libelle: programme!.libelle, actions: programme!.actions },
        action:    { id: action!.id, code: action!.code, libelle: action!.libelle, programmeId: programme!.id },
        typeService:  typeService!,
        localisation: localisation!,
        numeroOrdre,
        division:  { code: division!.code, libelle: division!.libelle, groupes: [] },
        groupe:    { code: groupe!.code, libelle: groupe!.libelle, classes: [] },
        classe:    { code: classe!.code, libelle: classe!.libelle },
        titre:     { code: titre!.code, libelle: titre!.libelle, articles: [] },
        article:   { code: article!.code, libelle: article!.libelle, paragraphes: [] },
        paragraphe: { code: paragraphe!.code, libelle: paragraphe!.libelle, rubriques: [] },
        rubrique:  { code: rubrique!.code, libelle: rubrique!.libelle },
      };

      // Sauvegarder dans localStorage
      const raw = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      all.push(newImputation);
      localStorage.setItem('gbe_imputations', JSON.stringify(all));

      showToast(statut === 'BROUILLON'
        ? 'Imputation sauvegardée en brouillon.'
        : 'Imputation soumise au Contrôleur Financier.'
      );
      setTimeout(() => router.push(APP_ROUTES.ORD_IMPUTATIONS), 1200);
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg, #0D2B55 0%, #091e3a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', zIndex: 50,
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/images/logo-minfi.png" alt="MINFI" width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '.9rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>GBE – MINFI</p>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>Espace Ordonnateur</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 8px 10px' }}>Navigation</p>
          {[
            { label: 'Tableau de bord', href: APP_ROUTES.ORD_PRINCIPAL_DASHBOARD },
            { label: 'Imputations',      href: APP_ROUTES.ORD_IMPUTATIONS },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)' }}>{item.label}</span>
              </div>
            </Link>
          ))}

          {/* Progression dans la sidebar */}
          {progression > 0 && (
            <div style={{ margin: '16px 8px 0', padding: '12px', background: 'rgba(255,255,255,.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)' }}>
              <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Progression du formulaire</p>
              <div style={{ height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progression}%`, background: progression === 100 ? '#22C55E' : '#FCD116', borderRadius: 4, transition: 'width .4s ease' }} />
              </div>
              <p style={{ fontSize: '.72rem', color: progression === 100 ? '#86EFAC' : '#FCD116', marginTop: 6, fontWeight: 600 }}>
                {progression}% rempli
              </p>
            </div>
          )}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button
            onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}
          >
            <IconLogout /> Déconnexion
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 6 }}>
          <div style={{ background: '#007A3D' }}/>
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </div>
          <div style={{ background: '#FCD116' }}/>
        </div>
      </aside>

      {/* ════════════ CONTENU ════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <button
            onClick={() => router.push(APP_ROUTES.ORD_IMPUTATIONS)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}
          >
            <IconArrowLeft /> Retour
          </button>
          <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1 }}>
              Nouvelle imputation budgétaire
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              {userCtx?.sectionLibelle ?? '…'} · Exercice {userCtx?.exerciceLibelle ?? '…'}
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
        <div style={{ background: '#007A3D' }}/>
        <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="6" height="6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </div>
        <div style={{ background: '#FCD116' }}/>
      </div>

        <main style={{ flex: 1, padding: '28px 32px 120px', overflowY: 'auto' }}>

          {/* ── Grille : formulaire (gauche) + code live (droite fixe) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* ════ COLONNE FORMULAIRE ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── BLOC A : Identité (auto) ── */}
              <div style={blocStyle}>
                <BlocHeader numero={1} titre="Identité budgétaire" desc="Données automatiques issues de votre affectation" color="#8E9BAA" done={true} />
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <ReadOnlyField label="Exercice budgétaire" value={userCtx?.exerciceLibelle ?? '—'} badge={userCtx?.codeExercice} />
                  <ReadOnlyField label="Section (ministère)" value={userCtx?.sectionLibelle ?? '—'} badge={userCtx?.codeSection} />
                </div>
              </div>

              {/* ── BLOC B : Objet de la dépense ── */}
              <div style={blocStyle}>
                <BlocHeader numero={2} titre="Objet de la dépense" desc="Description humaine de la dépense à imputer" color="#0D2B55" done={!!libelle.trim()} />
                <div style={{ padding: '20px' }}>
                  <label style={labelStyle}>Libellé de la dépense *</label>
                  <textarea
                    value={libelle}
                    onChange={e => { setLibelle(e.target.value); setErrors(prev => ({ ...prev, libelle: undefined })) }}
                    placeholder="Ex : Achat de 10 ordinateurs portables pour la Direction du Budget"
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: `1.5px solid ${errors.libelle ? '#CE1126' : '#E8ECF0'}`,
                      borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '.875rem',
                      color: '#1A202C', resize: 'vertical', outline: 'none',
                      transition: 'border-color .15s',
                    }}
                    onFocus={e  => { e.target.style.borderColor = '#0D2B55'; }}
                    onBlur={e   => { e.target.style.borderColor = errors.libelle ? '#CE1126' : '#E8ECF0'; }}
                  />
                  {errors.libelle && <p style={errorStyle}><IconAlert /> {errors.libelle}</p>}
                  <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 6 }}>
                    {libelle.length}/255 caractères
                  </p>
                </div>
              </div>

              {/* ── BLOC C : Classification programmatique ── */}
              <div style={blocStyle}>
                <BlocHeader numero={3} titre="Classification programmatique" desc="Programme budgétaire et action associée" color="#0D2B55" done={!!programmeId && !!actionId} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div>
                    <SearchableSelect
                      id="programme"
                      label="Programme budgétaire *"
                      placeholder="Rechercher un programme…"
                      options={toIdOptions(FAKE_PROGRAMMES)}
                      multiple={false}
                      value={programmeId}
                      onChange={handleProgrammeChange}
                    />
                    {errors.programmeId && <p style={errorStyle}><IconAlert /> {errors.programmeId}</p>}
                  </div>

                  {programmeId && (
                    <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={labelStyle}>Action *</label>
                        <button
                          type="button"
                          onClick={() => setShowAddAction(v => !v)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#007A3D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}
                        >
                          <IconPlus /> Créer une action
                        </button>
                      </div>

                      {/* Mini-formulaire création action */}
                      {showAddAction && (
                        <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 10, animation: 'fadeSlideDown .15s ease' }}>
                          <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#166534', marginBottom: 8 }}>
                            Créer une nouvelle action
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              value={newActionLabel}
                              onChange={e => setNewActionLabel(e.target.value)}
                              placeholder="Libellé de l'action…"
                              onKeyDown={e => { if (e.key === 'Enter') handleCreateAction(); }}
                              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #BBF7D0', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '.875rem', outline: 'none' }}
                            />
                            <button
                              type="button"
                              onClick={handleCreateAction}
                              disabled={!newActionLabel.trim() || addingAction}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', borderRadius: 8, background: '#007A3D', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600, opacity: !newActionLabel.trim() ? .5 : 1 }}
                            >
                              {addingAction ? <Spinner size={13} color="#fff" /> : <IconCheck />} Créer
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddAction(false); setNewActionLabel(''); }}
                              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#8E9BAA' }}
                            >
                              <IconX />
                            </button>
                          </div>
                        </div>
                      )}

                      <SearchableSelect
                        id="action"
                        label=""
                        placeholder="Sélectionner une action…"
                        options={actions}
                        multiple={false}
                        value={actionId}
                        onChange={id => { setActionId(id); setErrors(prev => ({ ...prev, actionId: undefined })) }}
                      />
                      {errors.actionId && <p style={errorStyle}><IconAlert /> {errors.actionId}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── BLOC D : Chapitre ── */}
              <div style={blocStyle}>
                <BlocHeader numero={4} titre="Chapitre (unité administrative)" desc="Type de service · Localisation géographique · N° d'ordre" color="#7C3AED" done={!!codeTypeService && !!codeLocalisation && !!numeroOrdre} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div>
                    <SearchableSelect
                      id="typeService"
                      label="Type de service *"
                      placeholder="Rechercher un type de service…"
                      options={toOptions(TYPES_DE_SERVICE)}
                      multiple={false}
                      value={codeTypeService}
                      onChange={v => { setCodeTypeService(v); setErrors(prev => ({ ...prev, codeTypeService: undefined })) }}
                    />
                    {errors.codeTypeService && <p style={errorStyle}><IconAlert /> {errors.codeTypeService}</p>}
                  </div>

                  <div>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>Localisation géographique *</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <SearchableSelect
                        id="region"
                        label="Région"
                        placeholder="Région…"
                        options={REGIONS_CAMEROUN.map(r => ({ id: r.code, label: r.libelle, code: r.code }))}
                        multiple={false}
                        value={codeRegion}
                        onChange={handleRegionChange}
                      />
                      <SearchableSelect
                        id="departement"
                        label="Département"
                        placeholder="Département…"
                        options={departements}
                        multiple={false}
                        value={codeDepartement}
                        onChange={handleDepartementChange}
                        disabled={!codeRegion}
                      />
                      <SearchableSelect
                        id="arrondissement"
                        label="Arrondissement"
                        placeholder="Arrondissement…"
                        options={arrondissements}
                        multiple={false}
                        value={codeLocalisation}
                        onChange={v => { setCodeLocalisation(v); setErrors(prev => ({ ...prev, codeLocalisation: undefined })) }}
                        disabled={!codeDepartement}
                      />
                    </div>
                    {errors.codeLocalisation && <p style={errorStyle}><IconAlert /> {errors.codeLocalisation}</p>}
                  </div>

                  <div>
                    <SearchableSelect
                      id="ordre"
                      label="Numéro d'ordre *"
                      placeholder="Sélectionner le n° d'ordre…"
                      options={ordreOptions}
                      multiple={false}
                      value={numeroOrdre}
                      onChange={v => { setNumeroOrdre(v); setErrors(prev => ({ ...prev, numeroOrdre: undefined })) }}
                    />
                    {errors.numeroOrdre && <p style={errorStyle}><IconAlert /> {errors.numeroOrdre}</p>}
                    <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 6 }}>
                      Identifie l'unité administrative au sein d'une même catégorie et localisation.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── BLOC E : Classification fonctionnelle ── */}
              <div style={blocStyle}>
                <BlocHeader numero={5} titre="Classification fonctionnelle" desc="Destination socio-économique de la dépense" color="#0F6E56" done={!!codeDivision && !!codeGroupe && !!codeClasse} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div>
                    <SearchableSelect
                      id="division"
                      label="Division *"
                      placeholder="Sélectionner la division…"
                      options={DIVISIONS_FONCTIONNELLES.map(d => ({ id: d.code, label: d.libelle, code: d.code }))}
                      multiple={false}
                      value={codeDivision}
                      onChange={handleDivisionChange}
                    />
                    {errors.codeDivision && <p style={errorStyle}><IconAlert /> {errors.codeDivision}</p>}
                  </div>

                  {codeDivision && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeSlideDown .2s ease' }}>
                      <div>
                        <SearchableSelect
                          id="groupe"
                          label="Groupe *"
                          placeholder="Groupe…"
                          options={groupes}
                          multiple={false}
                          value={codeGroupe}
                          onChange={handleGroupeChange}
                        />
                        {errors.codeGroupe && <p style={errorStyle}><IconAlert /> {errors.codeGroupe}</p>}
                      </div>
                      <div>
                        <SearchableSelect
                          id="classe"
                          label="Classe *"
                          placeholder="Classe…"
                          options={classes}
                          multiple={false}
                          value={codeClasse}
                          onChange={v => { setCodeClasse(v); setErrors(prev => ({ ...prev, codeClasse: undefined })) }}
                          disabled={!codeGroupe}
                        />
                        {errors.codeClasse && <p style={errorStyle}><IconAlert /> {errors.codeClasse}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── BLOC F : Classification économique ── */}
              <div style={blocStyle}>
                <BlocHeader numero={6} titre="Classification économique" desc="Nature de la dépense selon le Plan Comptable de l'État" color="#B45309" done={!!codeTitre && !!codeArticle && !!codeParagraphe && !!codeRubrique} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div>
                    <SearchableSelect
                      id="titre"
                      label="Titre *"
                      placeholder="Sélectionner le titre…"
                      options={TITRES_ECONOMIQUES.map(t => ({ id: t.code, label: t.libelle, code: t.code }))}
                      multiple={false}
                      value={codeTitre}
                      onChange={handleTitreChange}
                    />
                    {errors.codeTitre && <p style={errorStyle}><IconAlert /> {errors.codeTitre}</p>}
                  </div>

                  {codeTitre && (
                    <div style={{ animation: 'fadeSlideDown .2s ease' }}>
                      <SearchableSelect
                        id="article"
                        label="Article *"
                        placeholder="Sélectionner l'article…"
                        options={articles}
                        multiple={false}
                        value={codeArticle}
                        onChange={handleArticleChange}
                      />
                      {errors.codeArticle && <p style={errorStyle}><IconAlert /> {errors.codeArticle}</p>}
                    </div>
                  )}

                  {codeArticle && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeSlideDown .2s ease' }}>
                      <div>
                        <SearchableSelect
                          id="paragraphe"
                          label="Paragraphe *"
                          placeholder="Paragraphe…"
                          options={paragraphes}
                          multiple={false}
                          value={codeParagraphe}
                          onChange={handleParagrapheChange}
                        />
                        {errors.codeParagraphe && <p style={errorStyle}><IconAlert /> {errors.codeParagraphe}</p>}
                      </div>
                      <div>
                        <SearchableSelect
                          id="rubrique"
                          label="Rubrique *"
                          placeholder="Rubrique…"
                          options={rubriques}
                          multiple={false}
                          value={codeRubrique}
                          onChange={v => { setCodeRubrique(v); setErrors(prev => ({ ...prev, codeRubrique: undefined })) }}
                          disabled={!codeParagraphe}
                        />
                        {errors.codeRubrique && <p style={errorStyle}><IconAlert /> {errors.codeRubrique}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ════ COLONNE DROITE : CODE LIVE ════ */}
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Carte code d'imputation */}
              <div style={{ background: '#0D2B55', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(13,43,85,.25)' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconCode />
                    <p style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff' }}>Code d'imputation</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!isComplete}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, background: 'rgba(255,255,255,.08)', cursor: isComplete ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', fontSize: '.72rem', color: '#fff', opacity: isComplete ? 1 : .5 }}
                  >
                    {copied ? <IconCheck /> : <IconCopy />} {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                {/* Code affiché segment par segment */}
                <div style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {[
                      { label: 'Exo',  value: codeExercice   || '__',  color: '#8E9BAA', done: !!codeExercice },
                      { label: 'Sec',  value: codeSection    || '__',  color: '#8E9BAA', done: !!codeSection  },
                      { label: 'Prog', value: programme?.code || '___', color: '#378ADD', done: !!programmeId },
                      { label: 'Act',  value: action?.code   || '_',   color: '#378ADD', done: !!actionId },
                      { label: 'TSvc', value: codeTypeService || '__',  color: '#7C3AED', done: !!codeTypeService },
                      { label: 'Loc',  value: codeLocalisation|| '____',color: '#7C3AED', done: !!codeLocalisation },
                      { label: 'Ord',  value: numeroOrdre    || '__',  color: '#7C3AED', done: !!numeroOrdre },
                      { label: 'Div',  value: codeDivision   || '__',  color: '#1D9E75', done: !!codeDivision },
                      { label: 'Grp',  value: codeGroupe     || '_',   color: '#1D9E75', done: !!codeGroupe },
                      { label: 'Cl',   value: codeClasse     || '_',   color: '#1D9E75', done: !!codeClasse },
                      { label: 'Tit',  value: codeTitre      || '_',   color: '#EF9F27', done: !!codeTitre },
                      { label: 'Art',  value: codeArticle    || '__',  color: '#EF9F27', done: !!codeArticle },
                      { label: 'Para', value: codeParagraphe || '_',   color: '#EF9F27', done: !!codeParagraphe },
                      { label: 'Rub',  value: codeRubrique   || '__',  color: '#EF9F27', done: !!codeRubrique },
                    ].map((seg, i) => (
                      <React.Fragment key={i}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '.6rem', color: seg.done ? seg.color : 'rgba(255,255,255,.3)', marginBottom: 2, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                            {seg.label}
                          </p>
                          <code style={{
                            display: 'block',
                            padding: '4px 6px',
                            borderRadius: 5,
                            background: seg.done ? `${seg.color}20` : 'rgba(255,255,255,.05)',
                            border: `1px solid ${seg.done ? `${seg.color}40` : 'rgba(255,255,255,.1)'}`,
                            fontFamily: 'monospace',
                            fontSize: '.8rem',
                            fontWeight: 700,
                            color: seg.done ? seg.color : 'rgba(255,255,255,.25)',
                            letterSpacing: '.1em',
                            transition: 'all .3s',
                            minWidth: String(seg.value).length * 9 + 12,
                          }}>
                            {seg.value}
                          </code>
                        </div>
                        {i < 13 && <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.2)', alignSelf: 'flex-end', paddingBottom: 4 }}>·</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Barre de progression */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${progression}%`, background: progression === 100 ? '#22C55E' : '#FCD116', borderRadius: 4, transition: 'width .4s ease' }} />
                  </div>
                  <p style={{ fontSize: '.72rem', color: progression === 100 ? '#86EFAC' : 'rgba(255,255,255,.4)', textAlign: 'center' }}>
                    {progression === 100 ? '✓ Code complet' : `${champsRemplis} / ${totalChamps} champs remplis`}
                  </p>
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div style={{ background: '#007A3D' }}/>
                <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="5" height="5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </div>
                <div style={{ background: '#FCD116' }}/>
              </div>
              </div>

              {/* Récapitulatif des libellés sélectionnés */}
              {(programme || typeService || titre) && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8ECF0', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <p style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF0', fontSize: '.78rem', fontWeight: 600, color: '#0D2B55' }}>
                    Récapitulatif
                  </p>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {programme && <RecapLine label="Programme" value={`${programme.libelle} (${programme.code})`} />}
                    {action    && <RecapLine label="Action"    value={`${action.libelle} (${action.code})`} />}
                    {typeService  && <RecapLine label="Type service" value={`${typeService.libelle} (${typeService.code})`} />}
                    {localisation && <RecapLine label="Localisation" value={`${localisation.libelle} (${localisation.code})`} />}
                    {division  && <RecapLine label="Division"  value={`${division.libelle} (${division.code})`} />}
                    {titre     && <RecapLine label="Titre éco" value={`${titre.libelle} (${titre.code})`} />}
                    {rubrique  && <RecapLine label="Rubrique"  value={`${rubrique.libelle} (${rubrique.code})`} />}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => handleSave('EN_ATTENTE')}
                  disabled={isSubmitting || !isComplete}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '13px',
                    border: 'none', borderRadius: 10,
                    background: isSubmitting || !isComplete ? '#8E9BAA' : 'linear-gradient(135deg, #007A3D, #005A2D)',
                    cursor: isSubmitting || !isComplete ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 700, color: '#fff',
                    boxShadow: isComplete && !isSubmitting ? '0 4px 16px rgba(0,122,61,.3)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  {isSubmitting ? <><Spinner /> Envoi…</> : <><IconCheck /> Soumettre au CF</>}
                </button>

                <button
                  onClick={() => handleSave('BROUILLON')}
                  disabled={isSubmitting || !libelle.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '11px',
                    border: '1.5px solid #E8ECF0', borderRadius: 10,
                    background: '#fff', cursor: isSubmitting || !libelle.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 500, color: '#4A5568',
                    opacity: !libelle.trim() ? .5 : 1,
                    transition: 'all .15s',
                  }}
                >
                  Sauvegarder en brouillon
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderRadius: 10,
          background: toast.type === 'success' ? '#0D2B55' : '#CE1126',
          color: '#fff', fontSize: '.85rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          animation: 'fadeSlideDown .3s ease',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPOSANTS RÉUTILISABLES
// ─────────────────────────────────────────────────────────────

/** Champ en lecture seule avec badge code */
function ReadOnlyField({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: '#8E9BAA' }}><IconLock /></span> {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: '#F8F9FB',
        border: '1.5px solid #E8ECF0', borderRadius: 10,
        fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568',
      }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        {badge && (
          <code style={{ padding: '2px 8px', background: '#E8ECF0', borderRadius: 4, fontSize: '.75rem', color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>
            {badge}
          </code>
        )}
      </div>
    </div>
  );
}

/** Ligne dans le récapitulatif */
function RecapLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: '.7rem', color: '#8E9BAA', flexShrink: 0, paddingTop: 2, minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: '.78rem', color: '#1A202C', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

// Styles partagés
const blocStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  border: '1px solid #E8ECF0',
  boxShadow: '0 2px 12px rgba(0,0,0,.05)',
  overflow: 'hidden',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.8rem', fontWeight: 600,
  color: '#4A5568', marginBottom: 6,
};
const errorStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: '.75rem', color: '#CE1126', marginTop: 5,
};