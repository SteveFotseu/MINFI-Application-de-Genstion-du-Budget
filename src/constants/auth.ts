// ============================================================
// FICHIER  : src/constants/auth.ts
// ============================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';

// ── Auth — appels DIRECTS ────────────────────────────────────
export const AUTH_ENDPOINTS = {
  REGISTER:  `${API_BASE_URL}/api/v1/auth/register`,
  LOGIN:     `${API_BASE_URL}/api/v1/auth/login`,
  SETUP_MFA: `${API_BASE_URL}/api/v1/auth/setup-mfa`,
  VERIFY_2FA:`${API_BASE_URL}/api/v1/auth/verify`,
} as const;

// ── Admin — via proxy ────────────────────────────────────────
export const ADMIN_ENDPOINTS = {
  USERS:       '/api/proxy/admin/users',
  CREATE_USER: '/api/proxy/admin/users',

  USER_BY_ID:      (userId: string) => `/api/proxy/admin/users/${userId}`,
  USER_ACTIVATE:   (userId: string) => `/api/proxy/admin/users/${userId}/activate`,
  USER_DEACTIVATE: (userId: string) => `/api/proxy/admin/users/${userId}/deactivate`,
  USER_DELETE:     (userId: string) => `/api/proxy/admin/users/${userId}`,

  // Agents
  AGENTS:                 '/api/proxy/admin/agents',
  AGENTS_WITHOUT_ACCOUNT: '/api/proxy/admin/agents/without-account',
  CREATE_AGENT:           '/api/proxy/admin/agents',
  AGENT_BY_ID:            (agentId: string) => `/api/proxy/admin/agents/${agentId}`,
  AGENT_ACTIVATE:         (agentId: string) => `/api/proxy/admin/agents/${agentId}/reactivate`,
  AGENT_DEACTIVATE:       (agentId: string) => `/api/proxy/admin/agents/${agentId}/deactivate`,

  // Rôles — retourne { code, libelle, defaultPermissions }
  // Le champ "roleSysteme" dans POST /admin/users attend le CODE (ex: "ORDONNATEUR")
  ROLES: '/api/proxy/admin/users/roles',
} as const;

// ── Référentiel — via proxy ──────────────────────────────────
export const REFERENTIEL_ENDPOINTS = {
  SECTIONS: '/api/proxy/referentiel/sections',
  PROGRAMMES_BY_SECTION: (sectionId: string) =>
    `/api/proxy/referentiel/sections/${sectionId}/programmes`,
} as const;

// ── Imputations — via proxy ──────────────────────────────────
export const IMPUTATION_ENDPOINTS = {
  BASE:      '/api/proxy/imputations',
  BY_ID:     (id: string) => `/api/proxy/imputations/${id}`,
  SOUMETTRE: (id: string) => `/api/proxy/imputations/${id}/soumettre`,
  VALIDER:   (id: string) => `/api/proxy/imputations/${id}/valider`,
  REJETER:   (id: string) => `/api/proxy/imputations/${id}/rejeter`,
} as const;

// ── Routes de navigation ──────────────────────────────────────
export const APP_ROUTES = {
  LOGIN:           '/login',
  REGISTER:        '/register',
  REGISTER_QR:     '/register/qrcode',
  TWO_FACTOR:      '/two-factor',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD:       '/dashboard',

  ADMIN_DASHBOARD:    '/admin/dashboard',
  ADMIN_CREATE_USER:  '/admin/users/create',
  ADMIN_USER_DETAIL:  (userId: string) => `/admin/users/${userId}`,
  ADMIN_EDIT_USER:    (userId: string) => `/admin/users/edit/${userId}`,

  // 🆕 Agents
  ADMIN_AGENTS:        '/admin/agents',
  ADMIN_CREATE_AGENT:  '/admin/agents/create',
  ADMIN_AGENT_DETAIL:  (agentId: string) => `/admin/agents/${agentId}`,

  ORD_PRINCIPAL_DASHBOARD: '/ordonnateur/dashboard',
  ORD_IMPUTATIONS:         '/ordonnateur/imputations',
  ORD_IMPUTATION_NOUVELLE: '/ordonnateur/imputations/nouvelle',
  ORD_IMPUTATION_DETAIL:   (id: string) => `/ordonnateur/imputations/${id}`,
  ORD_IMPUTATION_MODIFIER: (id: string) => `/ordonnateur/imputations/${id}/modifier`,

  CF_DASHBOARD:   '/controleur-financier/dashboard',
  CF_IMPUTATIONS: '/controleur-financier/imputations',

  COMPTABLE_DASHBOARD: '/comptable/dashboard',
} as const;

export const ROLE_ROUTES: Record<string, string> = {
  'ADMIN':                  '/admin/dashboard',
  'MINISTRE':               '/admin/dashboard',
  'ORDONNATEUR_PRINCIPAL':  '/ordonnateur/dashboard',
  'ORDONNATEUR_SECONDAIRE': '/ordonnateur/dashboard',
  'ORDONNATEUR_DELEGUE':    '/ordonnateur/dashboard',
  'ORDONNATEUR':            '/ordonnateur/dashboard',
  'CONTROLEUR_FINANCIER':   '/controleur-financier/dashboard',
  'COMPTABLE':              '/comptable/dashboard',
  'GESTIONNAIRE':           '/dashboard',
  'AGENT':                  '/dashboard',
};

export const TWO_FACTOR_CODE_LENGTH = 6;