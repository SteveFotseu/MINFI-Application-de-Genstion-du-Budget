import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

const TARGET = `${API_BASE_URL}/api/v1/admin/users/roles`;

function pickAuthorization(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth;
}

export async function GET(req: Request) {
  const auth = pickAuthorization(req);

  // Selon le back, l'accès peut être public ou admin-only.
  // Si Authorization est absente, on laisse passer la requête telle quelle.
  const upstream = await fetch(TARGET, {
    method: 'GET',
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
  return NextResponse.json(body, { status: upstream.status });
}

