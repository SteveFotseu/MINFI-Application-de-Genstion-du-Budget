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
//
// CORRECTIFS :
//   1. PATCH/POST/PUT sans body : on n'envoie PAS un body vide
//      (Spring Boot rejette body="" avec Content-Type=json → 400).
//   2. DELETE / 204 No Content : on retourne une vraie réponse
//      sans body (HTTP interdit le body sur 204 → sinon 500).
//   3. Content-Type JSON ajouté UNIQUEMENT si on a un body à envoyer.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://gbe-8clf.onrender.com';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  // Reconstruire le chemin : /api/proxy/admin/agents → /api/v1/admin/agents
  // On préserve aussi la query string (ex: ?page=1&size=20)
  const backendPath = `/api/v1/${path.join('/')}`;
  const targetUrl   = `${BACKEND_URL}${backendPath}${req.nextUrl.search}`;

  // Récupérer le token depuis le header Authorization de la requête entrante
  const authHeader = req.headers.get('Authorization') ?? '';

  // ── Lecture du body (uniquement pour les méthodes qui peuvent en avoir) ──
  // ⚠️ FIX BUG 1 : si le body est vide (PATCH activate/deactivate sans payload),
  // on ne forward RIEN. Sinon Spring reçoit Content-Type=json + body="" → 400.
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const raw = await req.text();
      body = raw.length > 0 ? raw : undefined;
    } catch {
      body = undefined;
    }
  }

  // ── Construction des headers ──
  // ⚠️ FIX BUG 3 : Content-Type:application/json UNIQUEMENT si on envoie un body.
  // Pour un PATCH sans body, envoyer Content-Type=json est interprété par Spring
  // comme "JSON vide attendu" → 400.
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // ── Appel vers le vrai back-end (serveur → serveur, pas de CORS) ──
  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
  } catch (err) {
    return NextResponse.json(
      { message: `Impossible de joindre le serveur : ${err}` },
      { status: 502 }
    );
  }

  // ── Gestion de la réponse ──
  // ⚠️ FIX BUG 2 : pour 204 No Content (et 205), HTTP interdit tout body.
  // NextResponse.json({}, {status:204}) crée un body → erreur "ERR_HTTP2_PROTOCOL_ERROR"
  // ou 500 selon le runtime. On retourne une réponse vide explicite.
  if (backendRes.status === 204 || backendRes.status === 205) {
    return new NextResponse(null, { status: backendRes.status });
  }

  // Lecture du contenu selon le Content-Type
  const contentType = backendRes.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: backendRes.status });
  }

  // Réponse texte (ex: erreur HTML, plain text)
  const text = await backendRes.text().catch(() => '');
  return new NextResponse(text, {
    status: backendRes.status,
    headers: { 'Content-Type': contentType || 'text/plain' },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;