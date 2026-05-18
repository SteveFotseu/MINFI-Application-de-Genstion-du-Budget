// ============================================================
// FICHIER  : src/app/api/proxy/[...path]/route.ts
// RÔLE     : Proxy universel vers le back-end GBE.
//
// POURQUOI :
//   Les appels directs du navigateur vers gbe-8clf.onrender.com
//   sont bloqués par CORS. Ce proxy fait transiter les requêtes
//   côté serveur Next.js, ce qui contourne le problème.
//
// USAGE :
//   Au lieu de : fetch('https://gbe-8clf.onrender.com/api/v1/admin/agents')
//   On appelle : fetch('/api/proxy/admin/agents')
//   Le proxy ajoute automatiquement le Bearer token.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  // Reconstruire le chemin : /api/proxy/admin/agents → /api/v1/admin/agents
  const backendPath = `/api/v1/${path.join('/')}`;
  const targetUrl   = `${BACKEND_URL}${backendPath}`;

  // Récupérer le token depuis le header Authorization de la requête entrante
  const authHeader = req.headers.get('Authorization') ?? '';

  // Copier les headers utiles
  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  // Lire le body si présent (POST, PUT, PATCH)
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try { body = await req.text(); } catch { body = undefined; }
  }

  // Appel vers le vrai back-end (serveur → serveur, pas de CORS)
  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method:  req.method,
      headers,
      body,
    });
  } catch (err) {
    return NextResponse.json(
      { message: `Impossible de joindre le serveur : ${err}` },
      { status: 502 }
    );
  }

  // Lire la réponse
  const contentType = backendRes.headers.get('content-type') ?? '';
  let data: unknown;

  if (contentType.includes('application/json')) {
    data = await backendRes.json().catch(() => null);
  } else {
    data = await backendRes.text().catch(() => '');
  }

  return NextResponse.json(data ?? {}, { status: backendRes.status });
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;