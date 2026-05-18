// ============================================================
// FICHIER  : src/lib/authService.ts
// ============================================================

import {
  LoginPayload, RegisterPayload, SetupMfaPayload, VerifyPayload,
  ForgotPasswordPayload, LoginResponse, RegisterResponse,
  VerifyResponse, GenericResponse, UserContext,
} from '@/types/auth';
import { AUTH_ENDPOINTS } from '@/constants/auth';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function postJson<TPayload, TResponse>(
  url: string, payload: TPayload, token?: string
): Promise<TResponse> {
  const headers: HeadersInit = { ...JSON_HEADERS };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
  }
  const data = await response.json().catch(() => ({
    success: false,
    message: `Erreur HTTP ${response.status} — réponse invalide du serveur.`,
  })) as TResponse & { message?: string };
  if (!response.ok) throw new Error((data as { message?: string }).message || `Erreur HTTP ${response.status}`);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return postJson<RegisterPayload, RegisterResponse>(AUTH_ENDPOINTS.REGISTER, payload);
}
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginPayload, LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload);
}
export async function setupMfa(payload: SetupMfaPayload): Promise<VerifyResponse> {
  return postJson<SetupMfaPayload, VerifyResponse>(AUTH_ENDPOINTS.SETUP_MFA, payload);
}
export async function verifyTwoFactor(payload: VerifyPayload): Promise<VerifyResponse> {
  return postJson<VerifyPayload, VerifyResponse>(AUTH_ENDPOINTS.VERIFY_2FA, payload);
}
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<GenericResponse> {
  return postJson<ForgotPasswordPayload, GenericResponse>(
    'https://gbe-8clf.onrender.com/api/v1/auth/forgot-password', payload
  );
}

// ── Token ──────────────────────────────────────────────────
export function saveAccessToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem('gbe_access_token', token);
}
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('gbe_access_token');
  return null;
}
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbe_access_token');
    localStorage.removeItem('gbe_user_context');
    sessionStorage.removeItem('gbe_email_2fa');
    sessionStorage.removeItem('gbe_mfa_token');
  }
}

// ── UserContext ─────────────────────────────────────────────
const USER_CONTEXT_KEY = 'gbe_user_context';

export function saveUserContext(ctx: UserContext): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(ctx));
  }
}

export function getUserContext(): UserContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as UserContext) : null;
  } catch {
    return null;
  }
}

export function clearUserContext(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(USER_CONTEXT_KEY);
}