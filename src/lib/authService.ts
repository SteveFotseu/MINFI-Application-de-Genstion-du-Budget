// ============================================================
// FICHIER  : src/lib/authService.ts
// RÔLE     : Couche d'abstraction entre les composants React
//            et l'API back-end GBE.
//
// Gestion d'erreurs :
//   - Les erreurs HTTP sont converties en ApiError typée
//   - Les codes d'erreur back-end sont exploitables dans les composants
//   - Les erreurs de validation par champ sont extraites et mappées
//
// ── MODIFICATION APPORTÉE ──────────────────────────────────
//   Ajout de deux fonctions pour persister le contexte utilisateur
//   (userContext) retourné par /api/v1/auth/verify :
//     - saveUserContext(ctx)  → stocke dans localStorage
//     - getUserContext()      → lit depuis localStorage
//   Ces fonctions permettent à two-factor/page.tsx de lire
//   le roleSysteme et rediriger vers le bon dashboard.
// ──────────────────────────────────────────────────────────
// ============================================================

import {
  LoginPayload,
  RegisterPayload,
  VerifyPayload,
  ForgotPasswordPayload,
  LoginResponse,
  RegisterResponse,
  VerifyResponse,
  GenericResponse,
  BackendErrorResponse,
  ApiError,
  ERROR_MESSAGES,
  FIELD_MAP,
  UserContext,   // ← NOUVEAU : type du contexte utilisateur
} from '@/types/auth';
import { AUTH_ENDPOINTS } from '@/constants/auth';

// Headers JSON envoyés avec chaque requête POST
const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
};

// ─────────────────────────────────────────────────────────────
// UTILITAIRE INTERNE
// ─────────────────────────────────────────────────────────────

/**
 * Construit un ApiError à partir de la réponse d'erreur du back-end.
 * Extrait le code, le message lisible et les erreurs par champ.
 */
function buildApiError(body: BackendErrorResponse, httpStatus: number): ApiError {
  // ── Cas 1 : erreurs de validation par champ (400 MethodArgumentNotValid)
  if (body.validationsErros && body.validationsErros.length > 0) {
    const fieldErrors: Record<string, string> = {};
    let globalMessage = 'Certains champs sont invalides. Vérifiez le formulaire.';

    body.validationsErros.forEach(ve => {
      // Convertir le nom de champ back-end → nom de champ formulaire React
      const formKey = FIELD_MAP[ve.field] ?? ve.field;
      // Utiliser le message traduit si disponible, sinon le message brut
      fieldErrors[formKey] = ERROR_MESSAGES[ve.code] ?? ve.message ?? 'Champ invalide.';
    });

    return new ApiError(globalMessage, body.code, fieldErrors, httpStatus);
  }

  // ── Cas 2 : erreur métier avec code (ex: EMAIL_ALREADY_EXISTS)
  if (body.code) {
    const humanMessage = ERROR_MESSAGES[body.code] ?? body.message ?? `Erreur : ${body.code}`;
    return new ApiError(humanMessage, body.code, {}, httpStatus);
  }

  // ── Cas 3 : message brut sans code structuré
  const fallback = body.message ?? `Erreur HTTP ${httpStatus}`;
  return new ApiError(fallback, undefined, {}, httpStatus);
}

/**
 * Exécute un POST JSON et retourne le corps parsé.
 * Lève un ApiError en cas d'erreur HTTP ou réseau.
 */
async function postJson<TPayload, TResponse>(
  url:     string,
  payload: TPayload,
  token?:  string,
): Promise<TResponse> {
  // Construire les headers (avec token Bearer si fourni)
  const headers: HeadersInit = { ...JSON_HEADERS };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    // Appel fetch vers l'API back-end
    response = await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify(payload),
    });
  } catch {
    // Erreur réseau (pas de connexion, serveur injoignable…)
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
      undefined,
      {},
      0,
    );
  }

  // Lire le corps de la réponse (même en cas d'erreur HTTP)
  let data: TResponse & BackendErrorResponse;
  try {
    data = await response.json();
  } catch {
    // La réponse n'est pas du JSON valide
    throw new ApiError(
      `Réponse invalide du serveur (HTTP ${response.status}).`,
      undefined,
      {},
      response.status,
    );
  }

  // Si le statut HTTP indique une erreur, construire un ApiError
  if (!response.ok) {
    throw buildApiError(data as BackendErrorResponse, response.status);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// FONCTIONS PUBLIQUES — APPELS API
// ─────────────────────────────────────────────────────────────

/** Inscription d'un nouvel utilisateur */
export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return postJson<RegisterPayload, RegisterResponse>(AUTH_ENDPOINTS.REGISTER, payload);
}

/** Connexion avec email + mot de passe */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginPayload, LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload);
}

/**
 * Vérification du code TOTP à 6 chiffres (2FA).
 *
 * La réponse contient :
 *   - accessToken  → JWT à stocker
 *   - userContext  → infos utilisateur + affectations avec roleSysteme
 *
 * C'est en lisant userContext.affectations[0].roleSysteme que
 * two-factor/page.tsx détermine vers quel dashboard rediriger.
 */
export async function verifyTwoFactor(payload: VerifyPayload): Promise<VerifyResponse> {
  return postJson<VerifyPayload, VerifyResponse>(AUTH_ENDPOINTS.VERIFY_2FA, payload);
}

/** Demande de réinitialisation du mot de passe */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<GenericResponse> {
  return postJson<ForgotPasswordPayload, GenericResponse>(
    `https://gbe-8clf.onrender.com/api/v1/auth/forgot-password`,
    payload,
  );
}

// ─────────────────────────────────────────────────────────────
// GESTION DU TOKEN JWT EN SESSION
// ─────────────────────────────────────────────────────────────

/** Sauvegarde le JWT d'accès dans localStorage */
export function saveAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gbe_access_token', token);
  }
}

/** Lit le JWT d'accès depuis localStorage (null si absent) */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gbe_access_token');
  }
  return null;
}

/** Supprime le JWT et le contexte utilisateur (déconnexion) */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbe_access_token');
    // ← NOUVEAU : on efface aussi le contexte utilisateur à la déconnexion
    localStorage.removeItem('gbe_user_context');
    sessionStorage.removeItem('gbe_email_2fa');
  }
}

// ─────────────────────────────────────────────────────────────
// GESTION DU CONTEXTE UTILISATEUR  ← NOUVEAU
// ─────────────────────────────────────────────────────────────

/**
 * Sauvegarde le userContext retourné par /api/v1/auth/verify
 * dans localStorage sous la clé 'gbe_user_context'.
 *
 * Appelée dans two-factor/page.tsx après vérification 2FA réussie,
 * avant la redirection vers le dashboard.
 *
 * Le userContext contient notamment :
 *   - firstName, lastName, email → pour afficher le nom dans la navbar
 *   - affectations[0].roleSysteme → pour la redirection et l'autorisation
 *
 * @param ctx - Le userContext retourné par le back-end
 */
export function saveUserContext(ctx: UserContext): void {
  if (typeof window !== 'undefined') {
    // Sérialiser l'objet en JSON pour le stocker dans localStorage
    localStorage.setItem('gbe_user_context', JSON.stringify(ctx));
  }
}

/**
 * Lit et désérialise le userContext depuis localStorage.
 *
 * Utilisée par les pages de dashboard pour :
 *   - Afficher le nom de l'utilisateur dans la navbar
 *   - Vérifier le rôle et bloquer l'accès si non autorisé
 *
 * @returns Le UserContext ou null si absent / invalide
 */
export function getUserContext(): UserContext | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('gbe_user_context');
    if (!raw) return null;

    try {
      // Désérialiser le JSON stocké
      return JSON.parse(raw) as UserContext;
    } catch {
      // Si le JSON est corrompu, on efface et on retourne null
      localStorage.removeItem('gbe_user_context');
      return null;
    }
  }
  return null;
}