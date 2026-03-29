import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

const TARGET = `${API_BASE_URL}/api/v1/referentiel/exercices`;

function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

export async function GET(req: Request) {
  const auth = pickAuth(req);

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

