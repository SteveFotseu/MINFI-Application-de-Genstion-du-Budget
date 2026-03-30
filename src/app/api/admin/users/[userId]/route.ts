// ============================================================
// FICHIER  : src/app/api/admin/users/[userId]/route.ts
// RÔLE     : Proxy Next.js pour les opérations sur un utilisateur
//            précis (récupération, mise à jour).
//
// ROUTES GÉRÉES :
//   GET   → récupère les informations d'un utilisateur par son ID
//   PATCH → met à jour les informations de base d'un utilisateur
// ============================================================

import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

// ─────────────────────────────────────────────────────────────
// UTILITAIRE : extraction du token Bearer
// ─────────────────────────────────────────────────────────────
function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/{userId}
// → Récupère les données complètes d'un utilisateur
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

  const target = `${API_BASE_URL}/api/v1/admin/users/${userId}`;

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
// PATCH /api/admin/users/{userId}
// → Met à jour les informations de base d'un utilisateur
// ─────────────────────────────────────────────────────────────
export async function PATCH(
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
  const target = `${API_BASE_URL}/api/v1/admin/users/${userId}`;

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