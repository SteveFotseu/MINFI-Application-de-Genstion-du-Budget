// ============================================================
// FICHIER  : src/types/auth.ts
// ============================================================

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload {
  firstName: string; lastName: string; email: string;
  password: string; confirmPassword: string;
  phoneNumber: string; dateOfBirth: string; mfaEnabled: boolean;
}
export interface SetupMfaPayload { email: string; code: string; mfaToken: string; }
export interface VerifyPayload   { email: string; code: string; mfaToken: string; }
export interface ForgotPasswordPayload { email: string; }
export interface RegisterResponse { mfaEnabled?: boolean; secretImageUri?: string; qrCodeUrl?: string; message?: string; }
export interface LoginResponse {
  success?: boolean; message?: string; accessToken?: string; refreshToken?: string;
  firstLogin?: boolean; mfaEnabled?: boolean; secretImageUri?: string; mfaToken?: string;
}
export interface Mandat {
  mandatId: string; roleSysteme: string; sectionId: string; sectionLibelle: string;
  sectionCode: string; programmeId: string | null; programmeLibelle: string | null;
  programmeCode: string | null; permissions: string[]; dateDebut: string;
  dateFin: string | null; numeroDecision: string | null; actif: boolean; valide: boolean;
}
export interface BackendUserContext {
  userId: string; firstName: string; lastName: string; email: string;
  matricule: string | null; nui: string | null; cni: string | null;
  role: string; mandats: Mandat[];
}
export interface VerifyResponse {
  success?: boolean; message?: string; accessToken?: string; refreshToken?: string;
  tokenType?: string; mfaEnabled?: boolean; firstLogin?: boolean;
  userContext?: BackendUserContext;
}
export interface UserContext {
  id: string; firstName: string; lastName: string; email: string;
  role: string; mandats: Mandat[];
}
export interface GenericResponse { success?: boolean; message?: string; }
export type FormErrors = Record<string, string | undefined>;