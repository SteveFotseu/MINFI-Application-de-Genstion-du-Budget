// ============================================================
// FICHIER  : src/app/api/referentiel/sections/exercice/[exerciceId]/route.ts
//
// RÔLE     : Proxy Next.js pour
//            GET /api/v1/referentiel/sections/exercice/{exerciceId}
//
// POURQUOI : Cette route n'existait pas → les sections ne se
//            chargeaient jamais après sélection d'un exercice.
// ============================================================

import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ exerciceId: string }> }
) {
  const { exerciceId } = await params;
  const auth = pickAuth(req);

  const upstream = await fetch(
    `${API_BASE_URL}/api/v1/referentiel/sections/exercice/${exerciceId}`,
    {
      method: 'GET',
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await upstream.json()
    : await upstream.text();

  return NextResponse.json(body, { status: upstream.status });
}