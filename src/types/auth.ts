// ============================================================
// FICHIER  : src/types/auth.ts
// RÔLE     : Définition des interfaces pour les échanges API
// ============================================================

// ─────────────────────────────────────────────────────────────
// PAYLOADS
// ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  firstName: string; lastName: string; email: string; phoneNumber: string;
  dateOfBirth: string; matricule: string; NIU: string;
  roleId: string; sectionId: string; programmeIds: string[];
  cniNumber: string; cniDeliveryDate: string; cniValidityDate: string; cniExpiryDate: string;
  password: string; confirmPassword: string; mfaEnabled: boolean;
}

/**
 * Payload POST /api/v1/admin/users
 * Création d'un utilisateur par l'administrateur.
 * Format aligné avec le back-end actuel :
 * - affectation(s) via `programmeIds[]` (et une section via `sectionId`)
 * - rôle via `roleSysteme`
 * - CNI via `numeroCni` + dates
 */
export interface AdminCreateUserPayload {
  firstName:   string;
  lastName:    string;
  matricule:   string;
  email:       string;
  phoneNumber: string;

  numeroCni: string;
  nui:        string;
  cniIssueDate: string;
  cniExpiryDate: string;

  roleSysteme: string;
  sectionId:   string;
  programmeIds: string[];

  password: string;

  /**
   * Certaines versions du back-end acceptent aussi la sélection d'actions.
   * On l'envoie uniquement si l'admin en a sélectionné.
   */
  actionIds?: string[];
}

export interface VerifyPayload {
  email: string; code: string; mfaToken?: string;
}

export interface SetupMfaPayload {
  email: string; code: string; mfaToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

// ─────────────────────────────────────────────────────────────
// CONTEXTE UTILISATEUR
// ─────────────────────────────────────────────────────────────

export interface Affectation {
  affectationId:    string;
  roleSysteme:      string;
  sectionId:        string;
  sectionLibelle:   string;
  sectionCode:      string;
  programmeId:      string;
  programmeLibelle: string;
  programmeCode:    string;
  permissions:      string[];
  actif:            boolean;
}

export interface UserContext {
  userId:       string;
  firstName:    string;
  lastName:     string;
  email:        string;
  matricule:    string | null;
  nui:          string | null;
  cni:          string | null;
  affectations: Affectation[];
}

// ─────────────────────────────────────────────────────────────
// RÉPONSES API
// ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  success?:        boolean;
  message?:        string;
  accessToken?:    string;
  mfaToken?:       string;
  mfaEnabled?:     boolean;
  firstLogin?:     boolean;
  secretImageUri?: string;
}

export interface RegisterResponse {
  message?: string;
  success?: boolean;
}

export interface MfaVerifyResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  mfaEnabled:   boolean;
  firstLogin:   boolean;
  userContext:  UserContext;
  message?:     string;
  success?:     boolean;
}

export interface GenericResponse {
  success?: boolean;
  message?: string;
}

// ─────────────────────────────────────────────────────────────
// ERREURS
// ─────────────────────────────────────────────────────────────

export interface BackendErrorResponse {
  code?:    string;
  message?: string;
  validationsErros?: { field: string; code: string; message: string }[];
}

export class ApiError extends Error {
  public readonly code:        string | undefined;
  public readonly fieldErrors: Record<string, string>;
  public readonly httpStatus:  number;

  constructor(message: string, code?: string, fieldErrors?: Record<string, string>, httpStatus?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fieldErrors = fieldErrors ?? {};
    this.httpStatus  = httpStatus  ?? 0;
  }
}

export type FormErrors = Record<string, string | undefined>;

// Types référentiel
export interface ReferentielSection  { id: string; libelle: string; code?: string; }
export interface ReferentielRole     { id: string; libelle: string; }
export interface ReferentielProgramme{ id: string; libelle: string; code?: string; }
export interface ReferentielAction   { id: string; libelle: string; code?: string; }

// Anciens types (compatibilité registerMockData.ts)
export interface Role      { id: string; label: string; }
export interface Section   { id: string; code: string; label: string; }
export interface Programme { id: string; code: string; label: string; }