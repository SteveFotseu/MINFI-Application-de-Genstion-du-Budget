// ============================================================
// FICHIER  : src/app/api/admin/users/[userId]/affectations/route.ts
// RÔLE     : Proxy Next.js pour les affectations d'un utilisateur.
//            Évite les problèmes CORS en relayant les requêtes
//            vers le back-end depuis le serveur Next.js.
//
// ROUTES GÉRÉES :
//   GET  → liste les affectations d'un utilisateur
//   POST → crée une nouvelle affectation (programmeId + roleSysteme)
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
// GET /api/admin/users/{userId}/affectations
// → Récupère toutes les affectations d'un utilisateur
//
// Retourne : Affectation[]
//   { affectationId, roleSysteme, sectionId, sectionLibelle,
//     programmeId, programmeLibelle, actif }
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const auth = pickAuth(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Missing Authorization header' },
      { status: 401 },
    );
  }

  const target = `${API_BASE_URL}/api/v1/admin/users/${userId}/affectations`;

  const upstream = await fetch(target, {
    method: 'GET',
    headers: {
      Authorization: auth,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await upstream.json()
    : await upstream.text();

  return NextResponse.json(body, { status: upstream.status });
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/users/{userId}/affectations
// → Crée une nouvelle affectation pour l'utilisateur
//
// Body attendu : { programmeId: string, roleSysteme: string }
//
// Retourne : Affectation créée
//   { affectationId, roleSysteme, sectionId, sectionLibelle,
//     programmeId, programmeLibelle, actif }
// ─────────────────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const auth = pickAuth(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Missing Authorization header' },
      { status: 401 },
    );
  }

  const payload = await req.json();
  const target = `${API_BASE_URL}/api/v1/admin/users/${userId}/affectations`;

  const upstream = await fetch(target, {
    method: 'POST',
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