const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://140.245.193.49:3000/api';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{
    path?: string[];
  }>;
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function rewriteSetCookieForFrontend(cookie: string, frontendProtocol: string) {
  const parts = cookie
    .split(';')
    .map(part => part.trim())
    .filter(part => !/^domain=/i.test(part) && !/^path=/i.test(part));

  const isLocalHttp = frontendProtocol === 'http:';
  const rewritten = parts
    .filter(part => !(isLocalHttp && /^secure$/i.test(part)))
    .map(part => (isLocalHttp && /^samesite=none$/i.test(part) ? 'SameSite=Lax' : part));

  return [...rewritten, 'Path=/'].join('; ');
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+?=)/g).map(cookie => cookie.trim()).filter(Boolean);
}

async function proxy(request: Request, context: RouteParams) {
  const { path = [] } = await context.params;
  const inboundUrl = new URL(request.url);
  const targetUrl = new URL(`${BACKEND_API_URL.replace(/\/$/, '')}/${path.join('/')}`);
  targetUrl.search = inboundUrl.search;

  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
    cache: 'no-store',
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });

  const responseHeaders = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header);
  }

  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = getSetCookie ? getSetCookie.call(response.headers) : [];
  const fallbackSetCookie = response.headers.get('set-cookie');
  if (setCookies.length === 0 && fallbackSetCookie) {
    setCookies.push(...splitSetCookieHeader(fallbackSetCookie));
  }
  if (setCookies.length > 0) {
    responseHeaders.delete('set-cookie');
    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', rewriteSetCookieForFrontend(cookie, inboundUrl.protocol));
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
