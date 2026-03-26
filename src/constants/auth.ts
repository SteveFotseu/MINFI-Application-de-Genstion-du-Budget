// ============================================================
// FICHIER  : src/constants/auth.ts
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';
const API_PREFIX = `${API_BASE_URL}/api/v1`;

export const AUTH_ENDPOINTS = {
  REGISTER:  `${API_PREFIX}/auth/register`,
  LOGIN:     `${API_PREFIX}/auth/login`,
  SETUP_MFA: `${API_PREFIX}/auth/setup-mfa`,   // ← PREMIÈRE connexion (scan QR)
  VERIFY_2FA:`${API_PREFIX}/auth/verify`,       // ← Connexions suivantes
} as const;

export const APP_ROUTES = {
  LOGIN:           '/login',
  REGISTER:        '/register',
  REGISTER_QR:     '/register/qrcode',
  TWO_FACTOR:      '/two-factor',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD:       '/dashboard',

  // Dashboards par rôle
  ADMIN_DASHBOARD:          '/admin/dashboard',
  ORD_PRINCIPAL_DASHBOARD:  '/ordonnateur/dashboard',
  CF_DASHBOARD:             '/controleur-financier/dashboard',
  COMPTABLE_DASHBOARD:      '/comptable/dashboard',
} as const;

/**
 * Mapping roleSysteme (back-end) → route du dashboard
 * Utilisé après la vérification MFA pour rediriger vers le bon espace
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