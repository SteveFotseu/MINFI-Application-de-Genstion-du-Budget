// ============================================================
// FICHIER  : src/lib/authService.ts
// ============================================================

import {
  LoginPayload, RegisterPayload, SetupMfaPayload, VerifyPayload,
  ForgotPasswordPayload, LoginResponse, RegisterResponse,
  MfaVerifyResponse, GenericResponse, ApiError, UserContext,
} from '@/types/auth';
import { AUTH_ENDPOINTS } from '@/constants/auth';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
};

async function postJson<TPayload, TResponse>(url: string, payload: TPayload): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: JSON_HEADERS,
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
      response.status
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
 * L'utilisateur a scanné le QR code et saisit son code TOTP.
 * Renvoie : accessToken + refreshToken + userContext
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
 * L'utilisateur saisit son code TOTP habituel.
 * Renvoie : accessToken + refreshToken + userContext
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
// STOCKAGE LOCAL
// ─────────────────────────────────────────────────────────────

export function saveAccessToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('gbe_access_token', token);
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('gbe_access_token');
  return null;
}

export function saveUserContext(ctx: UserContext): void {
  if (typeof window !== 'undefined' && ctx)
    localStorage.setItem('gbe_user_context', JSON.stringify(ctx));
}

export function getUserContext(): UserContext | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('gbe_user_context');
    if (!raw) return null;
    try { return JSON.parse(raw) as UserContext; } catch { return null; }
  }
  return null;
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbe_access_token');
    localStorage.removeItem('gbe_user_context');
    sessionStorage.removeItem('gbe_email_2fa');
    sessionStorage.removeItem('gbe_qr_code');
    sessionStorage.removeItem('gbe_mfa_token');
  }
}