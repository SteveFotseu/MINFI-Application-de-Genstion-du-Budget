// ============================================================
// FICHIER  : src/types/auth.ts
// RÔLE     : Définition des interfaces pour les échanges API
// ============================================================

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  dateOfBirth: string;
  matricule:   string;
  NIU:         string;
  roleId:      string;
  sectionId:   string;
  programmeIds:string[];
  cniNumber:       string;
  cniDeliveryDate: string;
  cniValidityDate: string;
  cniExpiryDate:   string;
  password:        string;
  confirmPassword: string;
  mfaEnabled:      boolean;
}

export interface VerifyPayload {
  email: string;
  code:  string;
}

// --- STRUCTURE DU CONTEXTE UTILISATEUR (JSON BACKEND) ---

export interface Affectation {
  affectationId:    string;
  roleSysteme:      string; // "ADMIN", "ORDONNATEUR_PRINCIPAL", etc.
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

// --- RÉPONSES API ---

export interface LoginResponse {
  success?:        boolean;
  message?:        string;
  accessToken?:    string;
  mfaEnabled?:     boolean;
  firstLogin?:     boolean;
  secretImageUri?: string; // QR Code Base64
}

export interface VerifyResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  mfaEnabled:   boolean;
  firstLogin:   boolean;
  userContext:  UserContext; // Contient le rôle
  message?:     string;
  success?:     boolean;
}

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
    this.code = code;
    this.fieldErrors = fieldErrors ?? {};
    this.httpStatus = httpStatus ?? 0;
  }
}

export type FormErrors = Record<string, string | undefined>;