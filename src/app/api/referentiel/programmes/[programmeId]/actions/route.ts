import { NextResponse, type NextRequest } from 'next/server';
import { API_BASE_URL } from '@/constants/auth';

function pickAuth(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programmeId: string }> },
) {
  const auth = pickAuth(req);
  const { programmeId } = await params;

  const target = `${API_BASE_URL}/api/v1/referentiel/programmes/${programmeId}/actions`;

  const upstream = await fetch(target, {
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

