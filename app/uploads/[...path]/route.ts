import { getApiBaseUrl } from '@/lib/api';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  const { path = [] } = await context.params;
  
  const apiBase = getApiBaseUrl();
  const backendBaseUrl = apiBase ? apiBase.replace(/\/api\/?$/, '') : 'http://localhost:8000';
  const targetUrl = new URL(`/uploads/${path.join('/')}`, backendBaseUrl);
  
  try {
    const headers = new Headers();
    const accept = request.headers.get('accept');
    if (accept) headers.set('accept', accept);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return new Response('Not found', { status: response.status });
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('connection');
    responseHeaders.delete('keep-alive');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Uploads Proxy] Request failed', { target: targetUrl.toString(), error });
    return new Response('Error fetching file', { status: 502 });
  }
}
