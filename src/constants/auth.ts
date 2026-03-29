// ============================================================
// FICHIER  : src/constants/auth.ts
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';
const API_PREFIX = `${API_BASE_URL}/api/v1`;

// ─────────────────────────────────────────────────────────────
// ENDPOINTS D'AUTHENTIFICATION (appels directs — pas de CORS car
// le back-end autorise ces routes sans preflight)
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
// côté serveur → pas de restriction CORS
// ─────────────────────────────────────────────────────────────
export const ADMIN_ENDPOINTS = {
  USERS:       '/api/admin/users',  // GET liste + POST création
  CREATE_USER: '/api/admin/users',
  USERS_ROLES: '/api/admin/users/roles', // GET /api/v1/admin/users/roles
} as const;

// ─────────────────────────────────────────────────────────────
// ENDPOINTS RÉFÉRENTIEL — via proxy Next.js (CORS résolu)
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

  /** GET /api/referentiel/exercices → tous les exercices */
  EXERCICES: '/api/referentiel/exercices',

  /**
   * GET /api/referentiel/sections/exercice/{exerciceId}
   * → sections filtrées par exercice
   */
  SECTIONS_BY_EXERCICE: (exerciceId: string) =>
    `/api/referentiel/sections/exercice/${exerciceId}`,

  /** GET /api/referentiel/roles → tous les rôles */
  ROLES: '/api/referentiel/roles',

  /**
   * GET /api/referentiel/sections/{sectionId}/programmes
   * → programmes d'une section donnée
   */
  PROGRAMMES_BY_SECTION: (sectionId: string) =>
    `/api/referentiel/sections/${sectionId}/programmes`,

  /**
   * GET /api/referentiel/programmes/{programmeId}/actions
   * → actions d'un programme donné
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

  // Dashboards par rôle
  ORD_PRINCIPAL_DASHBOARD:  '/ordonnateur/dashboard',
  CF_DASHBOARD:             '/controleur-financier/dashboard',
  COMPTABLE_DASHBOARD:      '/comptable/dashboard',
} as const;

/**
 * Mapping roleSysteme (back-end) → route du dashboard
 */
export const ROLE_ROUTES: Record<string, string> = {
  'ADMIN':                   '/admin/dashboard',
  'ORDONNATEUR_PRINCIPAL':   '/ordonnateur/dashboard',
  'ORDONNATEUR_SECONDAIRE':  '/ordonnateur/dashboard',
  'ORDONNATEUR_DELEGUE':     '/ordonnateur/dashboard',
  'CONTROLEUR_FINANCIER':    '/controleur-financier/dashboard',
  'COMPTABLE':               '/comptable/dashboard',
};

export const TWO_FACTOR_CODE_LENGTH = 6;