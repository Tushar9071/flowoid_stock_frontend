import { getApiUrl } from '@/lib/api';

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
  'expect',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const FORWARDED_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'cookie',
  'x-requested-with',
];

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
  const targetUrl = new URL(getApiUrl(path.join('/')), inboundUrl.origin);
  targetUrl.search = inboundUrl.search;

  const headers = new Headers();
  for (const header of FORWARDED_HEADERS) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }
  if (!headers.has('accept')) headers.set('accept', 'application/json');
  if (!headers.has('x-requested-with')) headers.set('x-requested-with', 'XMLHttpRequest');

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[API Proxy] Request failed', {
      target: targetUrl.toString(),
      error,
    });

    return Response.json(
      {
        success: false,
        error: {
          code: 'API_PROXY_ERROR',
          message: 'Unable to reach the backend API. Please try again.',
        },
      },
      { status: 502 }
    );
  }

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
