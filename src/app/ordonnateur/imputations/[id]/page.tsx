'use client';

// ============================================================
// FICHIER  : src/app/ordonnateur/imputations/[id]/page.tsx
// RÔLE     : Détail complet d'une imputation budgétaire.
//
// AFFICHE :
//   - Bannière statut colorée
//   - Code d'imputation complet par segments colorés + légende
//   - Récapitulatif de tous les champs en grille
//   - Motif de rejet (si REJETEE)
//   - Actions : Modifier · Soumettre · Supprimer
// ============================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

import { getAccessToken, getUserContext, clearTokens } from '@/lib/authService';
import { APP_ROUTES } from '@/constants/auth';
import { genererCodeImputation } from '@/types/imputation';
import type { ImputationBudgetaire, StatutImputation } from '@/types/imputation';

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const STATUT_CONFIG: Record<StatutImputation, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  BROUILLON:  { label: 'Brouillon',  color: '#4A5568', bg: '#F0F2F5', border: '#D1D8E0', dot: '#8E9BAA' },
  EN_ATTENTE: { label: 'En attente', color: '#92400E', bg: '#FFFBEB', border: '#FCD116', dot: '#D97706' },
  VALIDEE:    { label: 'Validée',    color: '#166534', bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E' },
  REJETEE:    { label: 'Rejetée',    color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
};

const CODE_SEGMENTS = [
  { key: 'codeExercice',     label: 'Exo',   color: '#8E9BAA' },
  { key: 'codeSection',      label: 'Sec',   color: '#8E9BAA' },
  { key: 'codeProgramme',    label: 'Prog',  color: '#378ADD' },
  { key: 'codeAction',       label: 'Act',   color: '#378ADD' },
  { key: 'codeTypeService',  label: 'TSvc',  color: '#7C3AED' },
  { key: 'codeLocalisation', label: 'Loc',   color: '#7C3AED' },
  { key: 'numeroOrdre',      label: 'Ord',   color: '#7C3AED' },
  { key: 'codeDivision',     label: 'Div',   color: '#1D9E75' },
  { key: 'codeGroupe',       label: 'Grp',   color: '#1D9E75' },
  { key: 'codeClasse',       label: 'Cl',    color: '#1D9E75' },
  { key: 'codeTitre',        label: 'Tit',   color: '#EF9F27' },
  { key: 'codeArticle',      label: 'Art',   color: '#EF9F27' },
  { key: 'codeParagraphe',   label: 'Para',  color: '#EF9F27' },
  { key: 'codeRubrique',     label: 'Rub',   color: '#EF9F27' },
];

// ─────────────────────────────────────────────────────────────
// ICÔNES
// ─────────────────────────────────────────────────────────────
const IconBack   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>);
const IconEdit   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconSend   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>);
const IconTrash  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconCopy   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const IconCheck  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>);
const IconLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconAlert  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);

const Spinner = ({ size = 14, color = '#0D2B55' }: { size?: number; color?: string }) => (
  <span style={{ display: 'inline-block', width: size, height: size, flexShrink: 0, border: '2px solid rgba(0,0,0,.1)', borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
);

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
export default function ImputationDetailPage() {
  const router     = useRouter();
  const { id }     = useParams<{ id: string }>();

  const [imp,        setImp]        = useState<ImputationBudgetaire | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [isPending,  setIsPending]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  // ── Guard ──
  useEffect(() => {
    if (!getAccessToken()) { router.replace(APP_ROUTES.LOGIN); return; }
    const ctx = getUserContext();
    const aff = ctx?.affectations?.find(a => a.actif) ?? ctx?.affectations?.[0];
    if (!aff?.roleSysteme?.startsWith('ORDONNATEUR')) {
      router.replace(APP_ROUTES.DASHBOARD);
    }
  }, [router]);

  // ── Chargement ──
  useEffect(() => {
    const raw  = localStorage.getItem('gbe_imputations');
    const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
    const found = all.find(i => i.id === id);
    if (found) setImp(found); else setNotFound(true);
    setLoading(false);
  }, [id]);

  const handleSoumettre = async () => {
    if (!imp || isPending) return;
    setIsPending(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const raw  = localStorage.getItem('gbe_imputations');
      const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
      const idx  = all.findIndex(i => i.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], statut: 'EN_ATTENTE', updatedAt: new Date().toISOString() };
        localStorage.setItem('gbe_imputations', JSON.stringify(all));
        setImp(all[idx]);
      }
      showToast('Imputation soumise au Contrôleur Financier.');
    } finally { setIsPending(false); }
  };

  const handleDelete = () => {
    const raw  = localStorage.getItem('gbe_imputations');
    const all: ImputationBudgetaire[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem('gbe_imputations', JSON.stringify(all.filter(i => i.id !== id)));
    router.push(APP_ROUTES.ORD_IMPUTATIONS);
  };

  const handleCopy = () => {
    if (!imp) return;
    const code = genererCodeImputation({
      codeExercice: imp.codeExercice, codeSection: imp.codeSection,
      codeProgramme: imp.programme.code, codeAction: imp.action.code,
      codeTypeService: imp.typeService.code, codeLocalisation: imp.localisation.code,
      numeroOrdre: imp.numeroOrdre, codeDivision: imp.division.code,
      codeGroupe: imp.groupe.code, codeClasse: imp.classe.code,
      codeTitre: imp.titre.code, codeArticle: imp.article.code,
      codeParagraphe: imp.paragraphe.code, codeRubrique: imp.rubrique.code,
    });
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
        <Spinner size={40} color="#0D2B55" />
      </div>
    );
  }
  if (notFound || !imp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 10 }}>Imputation introuvable</p>
          <Link href={APP_ROUTES.ORD_IMPUTATIONS} style={{ color: '#007A3D', fontSize: '.875rem' }}>← Retour à la liste</Link>
        </div>
      </div>
    );
  }

  const cfg       = STATUT_CONFIG[imp.statut];
  const canEdit   = imp.statut === 'BROUILLON' || imp.statut === 'REJETEE';
  const canSubmit = imp.statut === 'BROUILLON';
  const canDelete = imp.statut === 'BROUILLON';

  const segValues: Record<string, string> = {
    codeExercice:    imp.codeExercice,
    codeSection:     imp.codeSection,
    codeProgramme:   imp.programme.code,
    codeAction:      imp.action.code,
    codeTypeService: imp.typeService.code,
    codeLocalisation:imp.localisation.code,
    numeroOrdre:     imp.numeroOrdre,
    codeDivision:    imp.division.code,
    codeGroupe:      imp.groupe.code,
    codeClasse:      imp.classe.code,
    codeTitre:       imp.titre.code,
    codeArticle:     imp.article.code,
    codeParagraphe:  imp.paragraphe.code,
    codeRubrique:    imp.rubrique.code,
  };

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
          {[
            { label: 'Tableau de bord', href: APP_ROUTES.ORD_PRINCIPAL_DASHBOARD },
            { label: 'Imputations',      href: APP_ROUTES.ORD_IMPUTATIONS },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '10px 12px', borderRadius: 8 }}>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)' }}>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={() => { clearTokens(); router.push(APP_ROUTES.LOGIN); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, background: 'rgba(255,255,255,.06)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>
            <IconLogout /> Déconnexion
          </button>
        </div>
        {/* Bandes tricolores */}
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

      {/* CONTENU */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: '#fff', height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <button onClick={() => router.push(APP_ROUTES.ORD_IMPUTATIONS)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', color: '#4A5568' }}>
            <IconBack /> Retour
          </button>
          <div style={{ width: 1, height: 20, background: '#E8ECF0' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {imp.libelle}
            </h1>
            <p style={{ fontSize: '.72rem', color: '#8E9BAA', marginTop: 2 }}>
              Créée le {new Date(imp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {canEdit && (
              <Link href={APP_ROUTES.ORD_IMPUTATION_MODIFIER(imp.id)} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1.5px solid #007A3D', borderRadius: 8, background: '#F0FDF4', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600, color: '#007A3D' }}>
                  <IconEdit /> Modifier
                </button>
              </Link>
            )}
            {canSubmit && (
              <button disabled={isPending} onClick={handleSoumettre} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #0D2B55, #1A3A6B)', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(13,43,85,.2)' }}>
                {isPending ? <Spinner color="#fff" /> : <IconSend />} Soumettre au CF
              </button>
            )}
            {canDelete && (
              <button onClick={() => setConfirmDel(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1.5px solid #FECACA', borderRadius: 8, background: '#FEF2F2', cursor: 'pointer', color: '#CE1126' }}>
                <IconTrash />
              </button>
            )}
          </div>
        </header>

        {/* Bandes topbar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 4 }}>
          <div style={{ background: '#007A3D' }}/>
          <div style={{ background: '#CE1126', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="6" height="6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon fill="#FCD116" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </div>
          <div style={{ background: '#FCD116' }}/>
        </div>

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>

          {/* Bannière statut */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0, marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '.875rem', fontWeight: 700, color: cfg.color }}>
                {imp.statut === 'BROUILLON'  && 'Brouillon — Non soumise au Contrôleur Financier'}
                {imp.statut === 'EN_ATTENTE' && 'En attente — Transmise au Contrôleur Financier pour examen'}
                {imp.statut === 'VALIDEE'    && 'Validée — Approuvée par le CF, transmise au Comptable'}
                {imp.statut === 'REJETEE'    && 'Rejetée — Le Contrôleur Financier a refusé cette imputation'}
              </p>
              {imp.statut === 'REJETEE' && imp.motifRejet && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                  <span style={{ color: '#CE1126', flexShrink: 0 }}><IconAlert /></span>
                  <div>
                    <p style={{ fontSize: '.75rem', fontWeight: 600, color: '#991B1B', marginBottom: 3 }}>Motif du rejet :</p>
                    <p style={{ fontSize: '.82rem', color: '#991B1B', lineHeight: 1.6 }}>{imp.motifRejet}</p>
                  </div>
                </div>
              )}
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 999, border: `1.5px solid ${cfg.border}`, background: '#fff', color: cfg.color, fontSize: '.78rem', fontWeight: 700, flexShrink: 0 }}>
              {cfg.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

            {/* COLONNE GAUCHE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <InfoSection titre="Objet de la dépense">
                <p style={{ fontSize: '.875rem', color: '#1A202C', lineHeight: 1.7 }}>{imp.libelle}</p>
              </InfoSection>

              <InfoSection titre="Identité budgétaire">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoRow label="Exercice" value={new Date().getFullYear().toString()} badge={imp.codeExercice} />
                  <InfoRow label="Section" value={imp.codeSection} badge={imp.codeSection} />
                </div>
              </InfoSection>

              <InfoSection titre="Classification programmatique">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoRow label="Programme" value={imp.programme.libelle} badge={imp.programme.code} />
                  <InfoRow label="Action" value={imp.action.libelle} badge={imp.action.code} />
                </div>
              </InfoSection>

              <InfoSection titre="Chapitre (unité administrative)">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <InfoRow label="Type de service" value={imp.typeService.libelle} badge={imp.typeService.code} />
                  <InfoRow label="Localisation" value={imp.localisation.libelle} badge={imp.localisation.code} />
                  <InfoRow label="N° d'ordre" value={`Unité n° ${imp.numeroOrdre}`} badge={imp.numeroOrdre} />
                </div>
              </InfoSection>

              <InfoSection titre="Classification fonctionnelle">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <InfoRow label="Division" value={imp.division.libelle} badge={imp.division.code} />
                  <InfoRow label="Groupe" value={imp.groupe.libelle} badge={imp.groupe.code} />
                  <InfoRow label="Classe" value={imp.classe.libelle} badge={imp.classe.code} />
                </div>
              </InfoSection>

              <InfoSection titre="Classification économique">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InfoRow label="Titre" value={imp.titre.libelle} badge={imp.titre.code} />
                  <InfoRow label="Article" value={imp.article.libelle} badge={imp.article.code} />
                  <InfoRow label="Paragraphe" value={imp.paragraphe.libelle} badge={imp.paragraphe.code} />
                  <InfoRow label="Rubrique" value={imp.rubrique.libelle} badge={imp.rubrique.code} />
                </div>
              </InfoSection>
            </div>

            {/* COLONNE DROITE — code complet */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{ background: '#0D2B55', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(13,43,85,.25)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff' }}>Code d'imputation complet</p>
                  <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, background: 'rgba(255,255,255,.08)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.72rem', color: '#fff' }}>
                    {copied ? <><IconCheck /> Copié</> : <><IconCopy /> Copier</>}
                  </button>
                </div>

                <div style={{ padding: '16px 18px' }}>
                  {/* Segments */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {CODE_SEGMENTS.map((seg, i) => {
                      const val = segValues[seg.key];
                      return (
                        <React.Fragment key={seg.key}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '.58rem', color: seg.color, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 2 }}>{seg.label}</p>
                            <code style={{ display: 'block', padding: '4px 7px', borderRadius: 5, background: `${seg.color}20`, border: `1px solid ${seg.color}40`, fontFamily: 'monospace', fontSize: '.8rem', fontWeight: 700, color: seg.color, letterSpacing: '.08em' }}>
                              {val}
                            </code>
                          </div>
                          {i < CODE_SEGMENTS.length - 1 && (
                            <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.2)', alignSelf: 'flex-end', paddingBottom: 5 }}>·</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Code complet sur une ligne */}
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', marginBottom: 14 }}>
                    <code style={{ fontSize: '.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,.85)', letterSpacing: '.06em', wordBreak: 'break-all', lineHeight: 1.8 }}>
                      {Object.values(segValues).join(' · ')}
                    </code>
                  </div>

                  {/* Légende */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { color: '#8E9BAA', label: 'Identité',      detail: 'Exercice · Section' },
                      { color: '#378ADD', label: 'Programmatique', detail: 'Programme · Action' },
                      { color: '#7C3AED', label: 'Chapitre',       detail: 'Type · Localisation · Ordre' },
                      { color: '#1D9E75', label: 'Fonctionnelle',  detail: 'Division · Groupe · Classe' },
                      { color: '#EF9F27', label: 'Économique',     detail: 'Titre · Article · Para · Rubrique' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)' }}>{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bandes bas carte code */}
                <div style={{ position: 'relative', height: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div style={{ background: '#007A3D' }}/>
                  <div style={{ background: '#CE1126' }}/>
                  <div style={{ background: '#FCD116' }}/>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal suppression */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setConfirmDel(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#0D2B55', marginBottom: 10 }}>Supprimer cette imputation ?</h3>
            <p style={{ fontSize: '.82rem', color: '#991B1B', marginBottom: 20 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDel(false)} style={{ padding: '9px 18px', border: '1.5px solid #E8ECF0', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', color: '#4A5568' }}>Annuler</button>
              <button onClick={handleDelete} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#CE1126', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.875rem', fontWeight: 600, color: '#fff' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 10, background: toast.type === 'success' ? '#0D2B55' : '#CE1126', color: '#fff', fontSize: '.85rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.25)', animation: 'fadeSlideDown .3s ease' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// Micro-composants
function InfoSection({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8ECF0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
      <p style={{ padding: '12px 16px', borderBottom: '1px solid #F0F2F5', fontSize: '.78rem', fontWeight: 600, color: '#0D2B55', background: '#F8F9FB' }}>{titre}</p>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <p style={{ fontSize: '.68rem', color: '#8E9BAA', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {badge && <code style={{ padding: '2px 7px', background: '#E8ECF0', borderRadius: 4, fontSize: '.72rem', color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>{badge}</code>}
        <p style={{ fontSize: '.82rem', color: '#1A202C', lineHeight: 1.4 }}>{value}</p>
      </div>
    </div>
  );
}