/**
 * Proxy všech /api/* požadavků na backend.
 * Prohlížeč volá jen stejný origin (bez odhalení backend URL), lokálně i při hostování funguje stejně.
 */
const BACKEND_URL = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:4000';

function getBackendUrl(path: string[], searchParams: URLSearchParams): string {
  const pathStr = path.length ? path.join('/') : '';
  const query = searchParams.toString();
  const base = `${BACKEND_URL.replace(/\/$/, '')}/api`;
  const url = pathStr ? `${base}/${pathStr}` : base;
  return query ? `${url}?${query}` : url;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const url = getBackendUrl(path, new URL(request.url).searchParams);
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const url = getBackendUrl(path, new URL(request.url).searchParams);
  const contentType = request.headers.get('Content-Type') || '';

  let body: BodyInit;
  if (contentType.includes('multipart/form-data')) {
    body = await request.formData();
  } else {
    body = await request.text();
  }

  const headers: HeadersInit = {};
  if (!contentType.includes('multipart/form-data')) {
    headers['Content-Type'] = contentType;
  }

  const res = await fetch(url, {
    method: 'POST',
    body,
    headers,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
