// ============================================================
// FICHIER  : src/types/auth.ts
// ============================================================

// ─────────────────────────────────────────────────────────────
// PAYLOADS — ce qu'on ENVOIE au back-end
// ─────────────────────────────────────────────────────────────

/** Connexion : email + mot de passe */
export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  // ── 1. Informations personnelles ──
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  dateOfBirth: string; // "YYYY-MM-DD"

  // ── 2. Informations professionnelles ──
  matricule:          string;  // Matricule de la fonction publique
  roleId:             string;  // ID du rôle sélectionné     (@future)
  sectionId:          string;  // ID de la section admin      (@future)
  programmeIds:       string[]; // IDs des programmes choisis (@future)

  // ── 3. Carte Nationale d'Identité (@future) ──
  cniNumber:       string;
  cniDeliveryDate: string; // "YYYY-MM-DD"
  cniValidityDate: string; // "YYYY-MM-DD"
  cniExpiryDate:   string; // "YYYY-MM-DD"

  // ── 4. Sécurité ──
  password:        string;
  confirmPassword: string;
  mfaEnabled:      boolean;
  secretImgUri?:   string;
}

export interface VerifyPayload {
  email: string;
  code:  string;
}

export interface ForgotPasswordPayload {
  email: string;
}

// ─────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE — fournies par le back-end (@future)
// Pour l'instant données mockées dans registerMockData.ts
// ─────────────────────────────────────────────────────────────

/** Un rôle dans l'application GBE */
export interface Role {
  id:    string;
  label: string; // Ex: "Administrateur", "Gestionnaire de budget"
}

/** Une section administrative (ministère / direction) */
export interface Section {
  id:    string;
  code:  string; // Ex: "MIN-FI-001"
  label: string; // Ex: "Direction Générale du Budget"
}

/** Un programme budgétaire */
export interface Programme {
  id:    string;
  code:  string; // Ex: "P-001"
  label: string; // Ex: "Programme de Santé Publique"
}

// ─────────────────────────────────────────────────────────────
// RÉPONSES — ce que le back-end RETOURNE
// ─────────────────────────────────────────────────────────────

export interface RegisterResponse {
  mfaEnabled?:     boolean;
  secretImageUri?: string;
  qrCodeUrl?:      string;
  qrCode?:         string;
  message?:        string;
}

export interface LoginResponse {
  success?:      boolean;
  message?:      string;
  accessToken?:  string;
  refreshToken?: string;
  mfaEnabled?:   boolean;
  email?:        string;
}

export interface VerifyResponse {
  success?:      boolean;
  message?:      string;
  accessToken?:  string;
  refreshToken?: string;
}

export interface GenericResponse {
  success?: boolean;
  message?: string;
}

// ─────────────────────────────────────────────────────────────
// ERREURS BACK-END
// ─────────────────────────────────────────────────────────────

export type BackendErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'PHONE_NUMBER_ALREADY_EXISTS'
  | 'PASSWORD_MISMATCH'
  | 'BAD_CREDENTIALS'
  | 'ERR_USER_DISABLED'
  | 'USER_NOT_FOUND'
  | 'USERNAME_NOT_FOUND'
  | 'CHANGE_PASSWORD_MISMATCH'
  | 'INVALID_CURRENT_PASSWORD'
  | 'ACCOUNT_ALREADY_DEACTIVATED'
  | 'ENTITY_NOT_FOUND'
  | 'METHODE_ARGUMENT_NOT_VALID'
  | 'INTERNAL_EXCEPTION';

export interface BackendValidationError {
  field:   string;
  code:    string;
  message: string;
}

export interface BackendErrorResponse {
  code?:             BackendErrorCode | string;
  message?:          string;
  validationsErros?: BackendValidationError[]; // Typo volontaire : correspond au back-end Java
}

export class ApiError extends Error {
  public readonly code:        BackendErrorCode | string | undefined;
  public readonly fieldErrors: Record<string, string>;
  public readonly httpStatus:  number;

  constructor(
    message:      string,
    code?:        BackendErrorCode | string,
    fieldErrors?: Record<string, string>,
    httpStatus?:  number,
  ) {
    super(message);
    this.name        = 'ApiError';
    this.code        = code;
    this.fieldErrors = fieldErrors ?? {};
    this.httpStatus  = httpStatus  ?? 0;
  }
}

export const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS:
    'Cette adresse email est déjà associée à un compte existant.',
  PHONE_NUMBER_ALREADY_EXISTS:
    'Ce numéro de téléphone est déjà associé à un autre compte.',
  PASSWORD_MISMATCH:
    'Les mots de passe ne correspondent pas.',
  BAD_CREDENTIALS:
    'Email ou mot de passe incorrect. Vérifiez vos identifiants.',
  ERR_USER_DISABLED:
    "Votre compte est désactivé. Contactez l'administrateur.",
  USER_NOT_FOUND:
    'Aucun compte trouvé avec ces informations.',
  USERNAME_NOT_FOUND:
    'Aucun compte trouvé avec cette adresse email.',
  CHANGE_PASSWORD_MISMATCH:
    'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
  INVALID_CURRENT_PASSWORD:
    'Le mot de passe actuel saisi est incorrect.',
  ACCOUNT_ALREADY_DEACTIVATED:
    'Ce compte est déjà désactivé.',
  INTERNAL_EXCEPTION:
    'Une erreur interne est survenue. Veuillez réessayer.',
  METHODE_ARGUMENT_NOT_VALID:
    'Certains champs du formulaire sont invalides.',
  'VALIDATION.REGISTRATION.EMAIL.NOT_BLANK':      "L'adresse email est requise.",
  'VALIDATION.REGISTRATION.EMAIL.FORMAT':         "L'adresse email est invalide.",
  'VALIDATION.REGISTRATION.PASSWORD.NOT_BLANK':   'Le mot de passe est requis.',
  'VALIDATION.REGISTRATION.PASSWORD.SIZE':        'Le mot de passe doit faire entre 8 et 72 caractères.',
  'VALIDATION.REGISTRATION.CONFIRM_PASSWORD.WEAK':'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.',
  'VALIDATION.REGISTRATION.FIRSTNAME.NOT_BLANK':  'Le prénom est requis.',
  'VALIDATION.REGISTRATION.FIRSTNAME.SIZE':       'Le prénom doit faire entre 1 et 50 caractères.',
  'VALIDATION.REGISTRATION.LASTNAME.NOT_BLANK':   'Le nom de famille est requis.',
  'VALIDATION.REGISTRATION.LASTNAME.SIZE':        'Le nom de famille doit faire entre 1 et 50 caractères.',
  'VALIDATION.REGISTRATION.PHONE.FORMAT':         'Format de téléphone invalide. Exemple : +237 6XX XXX XXX',
  'VALIDATION.AUTHENTICATION.EMAIL.NOT_BLANK':    "L'adresse email est requise.",
  'VALIDATION.AUTHENTICATION.EMAIL.FORMAT':       "L'adresse email est invalide.",
  'VALIDATION.AUTHENTICATION.PASSWORD.NOT_BLANK': 'Le mot de passe est requis.',
};

export const FIELD_MAP: Record<string, string> = {
  email:           'email',
  password:        'password',
  confirmPassword: 'confirmPassword',
  firstName:       'firstName',
  lastName:        'lastName',
  phoneNumber:     'phoneNumber',
  dateOfBirth:     'dateOfBirth',
};

export type FormErrors = Record<string, string | undefined>;