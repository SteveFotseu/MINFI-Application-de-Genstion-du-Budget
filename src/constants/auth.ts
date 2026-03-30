// ============================================================
// FICHIER  : src/constants/auth.ts
// RÔLE     : Constantes centralisées de l'application GBE-MINFI.
//            URLs du back-end, routes Next.js, endpoints proxy.
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';
const API_PREFIX = `${API_BASE_URL}/api/v1`;

// ─────────────────────────────────────────────────────────────
// ENDPOINTS D'AUTHENTIFICATION
// Appels directs vers le back-end (pas de CORS sur ces routes)
// ─────────────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  REGISTER:  `${API_PREFIX}/auth/register`,
  LOGIN:     `${API_PREFIX}/auth/login`,
  SETUP_MFA: `${API_PREFIX}/auth/setup-mfa`,
  VERIFY_2FA:`${API_PREFIX}/auth/verify`,
} as const;

// ─────────────────────────────────────────────────────────────
// ENDPOINTS ADMIN — via proxy Next.js pour éviter CORS
// Le front appelle /api/admin/... → Next.js appelle le back-end
// depuis le serveur (pas de restriction CORS côté serveur)
// ─────────────────────────────────────────────────────────────
export const ADMIN_ENDPOINTS = {
  /** GET (liste) + POST (création) d'utilisateurs */
  USERS: '/api/admin/users',

  /** POST création d'un utilisateur */
  CREATE_USER: '/api/admin/users',

  /** GET liste des rôles disponibles */
  USERS_ROLES: '/api/admin/users/roles',

  /**
   * GET  /api/admin/users/{userId}          → infos d'un utilisateur
   * PATCH /api/admin/users/{userId}         → mise à jour infos de base
   */
  USER_BY_ID: (userId: string) => `/api/admin/users/${userId}`,

  /**
   * GET  /api/admin/users/{userId}/affectations
   *   → liste les affectations d'un utilisateur
   *   → retourne : Affectation[]
   *
   * POST /api/admin/users/{userId}/affectations
   *   → crée une nouvelle affectation
   *   → body : { programmeId: string, roleSysteme: string }
   *   → retourne : Affectation
   */
  USER_AFFECTATIONS: (userId: string) =>
    `/api/admin/users/${userId}/affectations`,

  /**
   * PATCH /api/admin/users/{userId}/affectations/{affectationId}/role
   *   → modifie le rôle d'une affectation existante
   *   → body : { roleSysteme: string }
   *   → retourne : Affectation mise à jour
   */
  USER_AFFECTATION_ROLE: (userId: string, affectationId: string) =>
    `/api/admin/users/${userId}/affectations/${affectationId}/role`,
} as const;

// ─────────────────────────────────────────────────────────────
// ENDPOINTS RÉFÉRENTIEL — via proxy Next.js (CORS résolu)
//
// HIÉRARCHIE : Exercice → Section → Programme → Action
//
// AVANT (causait l'erreur CORS) :
//   fetch('https://gbe-8clf.onrender.com/api/v1/referentiel/sections')
//
// APRÈS (proxy local, appel serveur) :
//   fetch('/api/referentiel/sections')
// ─────────────────────────────────────────────────────────────
export const REFERENTIEL_ENDPOINTS = {
  /** GET /api/referentiel/sections → toutes les sections */
  SECTIONS: '/api/referentiel/sections',

  /** GET /api/referentiel/exercices → tous les exercices budgétaires */
  EXERCICES: '/api/referentiel/exercices',

  /**
   * GET /api/referentiel/sections/exercice/{exerciceId}
   * → sections filtrées par exercice (1er niveau de cascade)
   */
  SECTIONS_BY_EXERCICE: (exerciceId: string) =>
    `/api/referentiel/sections/exercice/${exerciceId}`,

  /** GET /api/referentiel/roles → tous les rôles */
  ROLES: '/api/referentiel/roles',

  /**
   * GET /api/referentiel/sections/{sectionId}/programmes
   * → programmes d'une section (2ème niveau de cascade)
   */
  PROGRAMMES_BY_SECTION: (sectionId: string) =>
    `/api/referentiel/sections/${sectionId}/programmes`,

  /**
   * GET /api/referentiel/programmes/{programmeId}/actions
   * → actions d'un programme (3ème niveau de cascade)
   */
  ACTIONS_BY_PROGRAMME: (programmeId: string) =>
    `/api/referentiel/programmes/${programmeId}/actions`,
} as const;

// ─────────────────────────────────────────────────────────────
// ROUTES DE NAVIGATION NEXT.JS
// ─────────────────────────────────────────────────────────────
export const APP_ROUTES = {
  LOGIN:           '/login',
  REGISTER:        '/register',
  REGISTER_QR:     '/register/qrcode',
  TWO_FACTOR:      '/two-factor',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD:       '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',

  /** Route d'édition d'un utilisateur (admin) */
  ADMIN_EDIT_USER: (userId: string) => `/admin/users/edit/${userId}`,

  // Dashboards par rôle
  ORD_PRINCIPAL_DASHBOARD: '/ordonnateur/dashboard',
  CF_DASHBOARD:            '/controleur-financier/dashboard',
  COMPTABLE_DASHBOARD:     '/comptable/dashboard',
} as const;

/**
 * Mapping roleSysteme (back-end) → route du dashboard correspondant.
 * Utilisé après la vérification 2FA pour rediriger vers le bon espace.
 */
export const ROLE_ROUTES: Record<string, string> = {
  'ADMIN':                   '/admin/dashboard',
  'ORDONNATEUR_PRINCIPAL':   '/ordonnateur/dashboard',
  'ORDONNATEUR_SECONDAIRE':  '/ordonnateur/dashboard',
  'ORDONNATEUR_DELEGUE':     '/ordonnateur/dashboard',
  'CONTROLEUR_FINANCIER':    '/controleur-financier/dashboard',
  'COMPTABLE':               '/comptable/dashboard',
};

/** Longueur du code OTP pour la double authentification */
export const TWO_FACTOR_CODE_LENGTH = 6;