// ============================================================
// FICHIER  : src/types/imputation.ts
// RÔLE     : Interfaces TypeScript pour l'imputation budgétaire
//            selon le Décret N° 2019/3187/PM du 9 septembre 2019
//            portant Nomenclature Budgétaire de l'État (NBE).
//
// STRUCTURE D'UNE IMPUTATION (26+ caractères) :
//   Exercice (2) · Section (2) · Programme (3) · Action (1)
//   · TypeService (2) · Localisation (4) · Ordre (2)
//   · Division (2) · Groupe (1) · Classe (1)
//   · Titre (1) · Article (2) · Paragraphe (1) · Rubrique (2)
// ============================================================

// ─────────────────────────────────────────────────────────────
// TYPES PRIMITIFS — CODES DE LA NOMENCLATURE
// ─────────────────────────────────────────────────────────────

/** Code d'exercice budgétaire — 2 caractères (ex: "53" pour 2019, "60" pour 2026) */
export type CodeExercice = string;

/** Code de section (ministère/institution) — 2 caractères (ex: "20" pour MINFI) */
export type CodeSection = string;

/** Code de programme — 3 caractères numériques séquentiels (ex: "001", "232") */
export type CodeProgramme = string;

/** Code d'action — 1 caractère numérique auto-incrémenté (ex: "0", "1", "2") */
export type CodeAction = string;

/** Code de type de service — 2 caractères (ex: "33" pour directions techniques) */
export type CodeTypeService = string;

/** Code géographique — 4 caractères (ex: "1160" pour Yaoundé, "1430" pour Douala Ier) */
export type CodeLocalisation = string;

/** Numéro d'ordre de l'unité administrative — 2 caractères (ex: "01", "02") */
export type CodeOrdre = string;

/** Code de division fonctionnelle — 2 caractères (ex: "01" pour Svcs généraux) */
export type CodeDivision = string;

/** Code de groupe fonctionnel — 1 caractère (ex: "1" pour Fonctionnement organes) */
export type CodeGroupe = string;

/** Code de classe fonctionnelle — 1 caractère (ex: "1" pour Organes exécutifs) */
export type CodeClasse = string;

/** Code de titre économique — 1 caractère (ex: "3" pour Biens et services) */
export type CodeTitre = string;

/** Code d'article économique — 2 caractères (ex: "60" pour Achats de biens) */
export type CodeArticle = string;

/** Code de paragraphe économique — 1 caractère (ex: "1" pour Matières et fournitures) */
export type CodeParagraphe = string;

/** Code de rubrique économique — 2 caractères (ex: "12" pour Matériel informatique) */
export type CodeRubrique = string;

// ─────────────────────────────────────────────────────────────
// STATUTS D'UNE IMPUTATION
// Cycle de vie : BROUILLON → EN_ATTENTE → VALIDEE | REJETEE
// Une imputation rejetée peut être modifiée puis re-soumise.
// ─────────────────────────────────────────────────────────────
export type StatutImputation =
  | 'BROUILLON'    // Créée mais non soumise — modifiable librement
  | 'EN_ATTENTE'   // Soumise au Contrôleur Financier — en attente d'examen
  | 'VALIDEE'      // Validée par le CF → transmise au Comptable
  | 'REJETEE';     // Rejetée par le CF — retournée à l'ordonnateur avec motif

// ─────────────────────────────────────────────────────────────
// ENTITÉS DU RÉFÉRENTIEL
// Ces types décrivent les listes déroulantes du formulaire.
// Pour l'instant alimentées par les fakes data du décret,
// elles seront remplacées par des appels API côté back-end.
// ─────────────────────────────────────────────────────────────

/** Division de la classification fonctionnelle (10 divisions fixes) */
export interface Division {
  code:    CodeDivision;
  libelle: string;
  groupes: Groupe[];
}

/** Groupe — subdivision d'une division */
export interface Groupe {
  code:    CodeGroupe;    // 1 caractère
  libelle: string;
  classes: Classe[];
}

/** Classe — subdivision d'un groupe (niveau le plus opérationnel) */
export interface Classe {
  code:    CodeClasse;    // 1 caractère
  libelle: string;
}

/** Titre de la classification économique (6 titres fixes) */
export interface TitreEconomique {
  code:     CodeTitre;
  libelle:  string;
  articles: Article[];
}

/** Article — subdivision d'un titre (2 caractères, issu du PCE) */
export interface Article {
  code:        CodeArticle;
  libelle:     string;
  paragraphes: Paragraphe[];
}

/** Paragraphe — subdivision d'un article */
export interface Paragraphe {
  code:      CodeParagraphe;
  libelle:   string;
  rubriques: Rubrique[];
}

/** Rubrique — niveau le plus détaillé de la classification économique */
export interface Rubrique {
  code:    CodeRubrique;
  libelle: string;
}

/** Type de service — 2 premiers caractères du chapitre budgétaire */
export interface TypeService {
  code:    CodeTypeService;
  libelle: string;
}

/** Région du Cameroun */
export interface Region {
  code:        string;   // 2 caractères (ex: "10" pour Adamaoua)
  libelle:     string;
  departements: Departement[];
}

/** Département */
export interface Departement {
  code:           string;   // 3 caractères (ex: "100" pour Djérem)
  libelle:        string;
  arrondissements: Arrondissement[];
}

/** Arrondissement */
export interface Arrondissement {
  code:    CodeLocalisation;  // 4 caractères (ex: "1000" pour Ngaoundal)
  libelle: string;
}

/**
 * Unité administrative — représente un service identifiable
 * dans le chapitre budgétaire via ses 3 composantes :
 * type de service + localisation + numéro d'ordre
 */
export interface UniteAdministrative {
  /** Code complet du chapitre : TypeService + Localisation + Ordre (8 car.) */
  codeComplet:      string;
  typeService:      TypeService;
  localisation:     Arrondissement;
  numeroOrdre:      CodeOrdre;
  libelleService:   string;
}

/** Programme budgétaire (issu du référentiel existant) */
export interface Programme {
  id:      string;
  code:    CodeProgramme;
  libelle: string;
  /** Actions associées à ce programme */
  actions: Action[];
}

/**
 * Action — subdivision d'un programme.
 * Créée par l'ordonnateur via un libellé ; le code est auto-incrémenté.
 */
export interface Action {
  id:          string;
  code:        CodeAction;   // Auto-généré : "0", "1", "2"...
  libelle:     string;
  programmeId: string;
}

// ─────────────────────────────────────────────────────────────
// IMPUTATION BUDGÉTAIRE — ENTITÉ PRINCIPALE
// ─────────────────────────────────────────────────────────────

/**
 * Imputation budgétaire complète.
 *
 * Une imputation = une classification unique pour une dépense.
 * Elle ne porte PAS de montant — le montant est attaché à l'opération
 * (engagement, liquidation, paiement) qui référence cette imputation.
 */
export interface ImputationBudgetaire {
  id:        string;
  createdAt: string;
  updatedAt: string;

  // ── Identité (automatique depuis userContext) ──
  /** Code de l'exercice budgétaire en cours */
  codeExercice: CodeExercice;
  /** Code de la section (ministère) de l'ordonnateur */
  codeSection:  CodeSection;

  // ── Objet de la dépense (saisie libre) ──
  /** Description humaine de la dépense — ex: "Achat de 10 ordinateurs" */
  libelle: string;

  // ── Classification programmatique ──
  programme: Programme;
  action:    Action;

  // ── Chapitre (unité administrative) ──
  typeService:   TypeService;
  localisation:  Arrondissement;
  numeroOrdre:   CodeOrdre;

  // ── Classification fonctionnelle ──
  division: Division;
  groupe:   Groupe;
  classe:   Classe;

  // ── Classification économique ──
  titre:      TitreEconomique;
  article:    Article;
  paragraphe: Paragraphe;
  rubrique:   Rubrique;

  // ── Workflow ──
  statut: StatutImputation;

  /** Identifiant de l'ordonnateur créateur */
  createurId: string;

  /**
   * Motif de rejet fourni par le Contrôleur Financier.
   * Renseigné uniquement quand statut === 'REJETEE'.
   */
  motifRejet?: string;

  /** Identifiant du CF ayant traité l'imputation */
  controleurId?: string;

  /** Date de validation ou de rejet par le CF */
  dateDecisionCF?: string;
}

// ─────────────────────────────────────────────────────────────
// TYPES UTILITAIRES POUR LE FORMULAIRE
// ─────────────────────────────────────────────────────────────

/**
 * Payload de création d'une imputation.
 * Contient les codes sélectionnés dans chaque liste déroulante.
 */
export interface CreateImputationPayload {
  libelle:          string;
  programmeId:      string;
  actionId:         string;
  codeTypeService:  CodeTypeService;
  codeLocalisation: CodeLocalisation;
  numeroOrdre:      CodeOrdre;
  codeDivision:     CodeDivision;
  codeGroupe:       CodeGroupe;
  codeClasse:       CodeClasse;
  codeTitre:        CodeTitre;
  codeArticle:      CodeArticle;
  codeParagraphe:   CodeParagraphe;
  codeRubrique:     CodeRubrique;
}

/**
 * Payload de création d'une nouvelle action par l'ordonnateur.
 * Le code est auto-incrémenté côté back-end.
 */
export interface CreateActionPayload {
  libelle:     string;
  programmeId: string;
}

/**
 * Payload de rejet d'une imputation par le Contrôleur Financier.
 */
export interface RejeterImputationPayload {
  motifRejet: string;
}

/**
 * Erreurs de validation du formulaire d'imputation.
 * Chaque clé correspond à un champ du formulaire.
 */
/**
 * Erreurs de validation du formulaire d'imputation.
 * Inclut libelle (champ texte libre, hors CreateImputationPayload).
 */
export interface ImputationFormErrors {
  libelle?:          string;
  programmeId?:      string;
  actionId?:         string;
  codeTypeService?:  string;
  codeLocalisation?: string;
  numeroOrdre?:      string;
  codeDivision?:     string;
  codeGroupe?:       string;
  codeClasse?:       string;
  codeTitre?:        string;
  codeArticle?:      string;
  codeParagraphe?:   string;
  codeRubrique?:     string;
}

// ─────────────────────────────────────────────────────────────
// TYPE HELPER — CODE D'IMPUTATION COMPLET
// ─────────────────────────────────────────────────────────────

/**
 * Génère le code d'imputation budgétaire complet (26+ caractères)
 * à partir d'une imputation complète ou partielle.
 *
 * Format : XX XX XXX X XX XXXX XX XX X X XX X XX
 * Ex :     26 20 232 1 33 1160 01 01 1 1 60 1 12
 */
export function genererCodeImputation(
  data: Partial<CreateImputationPayload> & {
    codeExercice?: string;
    codeSection?:  string;
    codeProgramme?: string;
    codeAction?:    string;
  },
): string {
  const parts = [
    data.codeExercice    ?? '__',
    data.codeSection     ?? '__',
    data.codeProgramme   ?? '___',
    data.codeAction      ?? '_',
    data.codeTypeService ?? '__',
    data.codeLocalisation?? '____',
    data.numeroOrdre     ?? '__',
    data.codeDivision    ?? '__',
    data.codeGroupe      ?? '_',
    data.codeClasse      ?? '_',
    data.codeTitre       ?? '_',
    data.codeArticle     ?? '__',
    data.codeParagraphe  ?? '_',
    data.codeRubrique    ?? '__',
  ];
  return parts.join(' ');
}