// ============================================================
// FICHIER  : src/app/api/admin/users/[userId]/affectations/[affectationId]/role/route.ts
// RÔLE     : Proxy Next.js pour la modification du rôle
//            d'une affectation existante d'un utilisateur.
//
// ROUTE GÉRÉE :
//   PATCH → modifie le roleSysteme d'une affectation donnée
//
// Body attendu : { roleSysteme: string }
//
// Retourne l'affectation mise à jour :
//   { affectationId, roleSysteme, sectionId, sectionLibelle,
//     programmeId, programmeLibelle, actif }
// ============================================================

import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// UTILITAIRE : extraction du token Bearer depuis les headers
// ─────────────────────────────────────────────────────────────
function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/{userId}/affectations/{affectationId}/role
// → Modifie le rôle de l'utilisateur sur une affectation précise
//
// Params path : userId, affectationId
// Body        : { roleSysteme: "ADMIN" | "ORDONNATEUR_..." | ... }
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string; affectationId: string }> },
) {
  const { userId, affectationId } = await params;

  const auth = pickAuth(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Missing Authorization header' },
      { status: 401 },
    );
  }

  const payload = await req.json();
  const target = `${API_BASE_URL}/api/v1/admin/users/${userId}/affectations/${affectationId}/role`;

  const upstream = await fetch(target, {
    method: 'PATCH',
    headers: {
      Authorization: auth,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await upstream.json()
    : await upstream.text();

  return NextResponse.json(body, { status: upstream.status });
}