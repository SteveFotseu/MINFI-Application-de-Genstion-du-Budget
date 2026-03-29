// ============================================================
// FICHIER  : src/lib/authService.ts
// RÔLE     : Couche d'abstraction entre le Front et l'API GBE
//
// MODIFICATIONS :
//   - Ajout de createUser() pour POST /api/v1/admin/users
//   - Ajout de postJsonWithAuth() pour les appels avec JWT admin
// ============================================================

import {
  LoginPayload, RegisterPayload, SetupMfaPayload, VerifyPayload,
  ForgotPasswordPayload, LoginResponse, RegisterResponse,
  MfaVerifyResponse, GenericResponse, ApiError, UserContext,
  AdminCreateUserPayload,
} from '@/types/auth';
import { AUTH_ENDPOINTS, ADMIN_ENDPOINTS } from '@/constants/auth';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
};

// ─────────────────────────────────────────────────────────────
// UTILITAIRES INTERNES
// ─────────────────────────────────────────────────────────────

/**
 * POST JSON sans authentification (utilisé pour login, register, verify…).
 */
async function postJson<TPayload, TResponse>(
  url: string,
  payload: TPayload,
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: JSON_HEADERS,
      body:    JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Une erreur est survenue',
      data.code,
      {},
      response.status,
    );
  }

  return data;
}

/**
 * POST JSON AVEC authentification Bearer (utilisé par l'admin).
 * Lit le JWT depuis localStorage via getAccessToken().
 * Lance une ApiError 401 si le token est absent ou expiré.
 */
async function postJsonWithAuth<TPayload, TResponse>(
  url:     string,
  payload: TPayload,
): Promise<TResponse> {
  // Récupérer le JWT stocké après connexion
  const token = getAccessToken();
  if (!token) {
    // Pas de token → l'admin n'est pas connecté
    throw new ApiError("Vous devez être connecté pour effectuer cette action.", undefined, {}, 401);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: {
        ...JSON_HEADERS,
        'Authorization': `Bearer ${token}`, // JWT de l'admin dans le header
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Une erreur est survenue',
      data.code,
      {},
      response.status,
    );
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// FONCTIONS D'AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return postJson(AUTH_ENDPOINTS.REGISTER, payload);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return postJson(AUTH_ENDPOINTS.LOGIN, payload);
}

/**
 * POST /api/v1/auth/setup-mfa
 * Appelée lors de la PREMIÈRE connexion uniquement.
 */
export async function setupMfa(payload: SetupMfaPayload): Promise<MfaVerifyResponse> {
  return postJson(AUTH_ENDPOINTS.SETUP_MFA, {
    email:    payload.email.trim(),
    code:     String(payload.code).trim(),
    mfaToken: payload.mfaToken,
  });
}

/**
 * POST /api/v1/auth/verify
 * Appelée lors des CONNEXIONS SUIVANTES (firstLogin: false).
 */
export async function verifyTwoFactor(payload: VerifyPayload): Promise<MfaVerifyResponse> {
  return postJson(AUTH_ENDPOINTS.VERIFY_2FA, {
    email:    payload.email.trim(),
    code:     String(payload.code).trim(),
    mfaToken: payload.mfaToken,
  });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<GenericResponse> {
  return postJson(`https://gbe-8clf.onrender.com/api/v1/auth/forgot-password`, payload);
}

// ─────────────────────────────────────────────────────────────
// FONCTIONS ADMIN — GESTION DES UTILISATEURS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/users
 * Crée un nouvel utilisateur depuis le tableau de bord administrateur.
 *
 * ⚠️  Nécessite que l'admin soit connecté (JWT valide dans localStorage).
 *
 * Le payload contient toutes les informations de l'utilisateur :
 * infos personnelles, affectation (section + programme + actions + rôle),
 * CNI, et mot de passe par défaut défini par l'admin.
 *
 * Après création réussie, l'utilisateur reçoit ses identifiants par email
 * (envoi géré côté back-end) et devra changer son mot de passe à la
 * première connexion.
 */
export async function createUser(payload: AdminCreateUserPayload): Promise<GenericResponse> {
  return postJsonWithAuth<AdminCreateUserPayload, GenericResponse>(
    ADMIN_ENDPOINTS.CREATE_USER,
    payload,
  );
}

// ─────────────────────────────────────────────────────────────
// STOCKAGE LOCAL (localStorage / sessionStorage)
// ─────────────────────────────────────────────────────────────

/** Sauvegarde le JWT d'accès dans localStorage */
export function saveAccessToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('gbe_access_token', token);
}

/** Récupère le JWT d'accès depuis localStorage */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('gbe_access_token');
  return null;
}

/** Sauvegarde le contexte utilisateur (nom, rôle, affectations) */
export function saveUserContext(ctx: UserContext): void {
  if (typeof window !== 'undefined' && ctx)
    localStorage.setItem('gbe_user_context', JSON.stringify(ctx));
}

/** Récupère le contexte utilisateur stocké */
export function getUserContext(): UserContext | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('gbe_user_context');
    if (!raw) return null;
    try { return JSON.parse(raw) as UserContext; } catch { return null; }
  }
  return null;
}

/** Nettoie toutes les données de session (déconnexion) */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbe_access_token');
    localStorage.removeItem('gbe_user_context');
    sessionStorage.removeItem('gbe_email_2fa');
    sessionStorage.removeItem('gbe_qr_code');
    sessionStorage.removeItem('gbe_mfa_token');
  }
}