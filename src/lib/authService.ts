// ============================================================
// FICHIER  : src/lib/authService.ts
// RÔLE     : Couche d'abstraction entre les composants React
//            et l'API back-end GBE.
//
// Gestion d'erreurs :
//   - Les erreurs HTTP sont converties en ApiError typée
//   - Les codes d'erreur back-end sont exploitables dans les composants
//   - Les erreurs de validation par champ sont extraites et mappées
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
} from '@/types/auth';
import { AUTH_ENDPOINTS } from '@/constants/auth';

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
  const headers: HeadersInit = { ...JSON_HEADERS };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
      undefined,
      {},
      0,
    );
  }

  // Lire le corps (toujours, même en cas d'erreur HTTP)
  let data: TResponse & BackendErrorResponse;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      `Réponse invalide du serveur (HTTP ${response.status}).`,
      undefined,
      {},
      response.status,
    );
  }

  if (!response.ok) {
    throw buildApiError(data as BackendErrorResponse, response.status);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// FONCTIONS PUBLIQUES
// ─────────────────────────────────────────────────────────────

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return postJson<RegisterPayload, RegisterResponse>(AUTH_ENDPOINTS.REGISTER, payload);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginPayload, LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload);
}

export async function verifyTwoFactor(payload: VerifyPayload): Promise<VerifyResponse> {
  return postJson<VerifyPayload, VerifyResponse>(AUTH_ENDPOINTS.VERIFY_2FA, payload);
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<GenericResponse> {
  return postJson<ForgotPasswordPayload, GenericResponse>(
    `https://gbe-8clf.onrender.com/api/v1/auth/forgot-password`,
    payload,
  );
}

// ─────────────────────────────────────────────────────────────
// GESTION DU TOKEN EN SESSION
// ─────────────────────────────────────────────────────────────

export function saveAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gbe_access_token', token);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gbe_access_token');
  }
  return null;
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbe_access_token');
    sessionStorage.removeItem('gbe_email_2fa');
  }
}