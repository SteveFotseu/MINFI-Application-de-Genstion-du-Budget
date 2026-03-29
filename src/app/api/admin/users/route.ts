import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

const TARGET = `${API_BASE_URL}/api/v1/admin/users`;

function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

export async function GET(req: Request) {
  const auth = pickAuth(req);
  if (!auth) {
    return NextResponse.json({ message: 'Missing Authorization header' }, { status: 401 });
  }

  const upstream = await fetch(TARGET, {
    method: 'GET',
    headers: {
      Authorization: auth,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
  return NextResponse.json(body, { status: upstream.status });
}

export async function POST(req: Request) {
  const auth = pickAuth(req);
  if (!auth) {
    return NextResponse.json({ message: 'Missing Authorization header' }, { status: 401 });
  }

  const payload = await req.json();
  const upstream = await fetch(TARGET, {
    method: 'POST',
    headers: {
      Authorization: auth,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
  return NextResponse.json(body, { status: upstream.status });
}

