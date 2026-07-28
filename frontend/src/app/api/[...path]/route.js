/**
 * Next.js catch-all API proxy route.
 *
 * In development: the browser calls /api/* which hits this route handler,
 * which in turn forwards the request to the Express backend at localhost:5000.
 * This is necessary because:
 *   a) next.config rewrites silently drop Set-Cookie headers
 *   b) direct cross-origin requests from the browser break httpOnly cookies
 *
 * In production (Vercel + Railway): the frontend and backend are on different
 * domains, so the browser sends requests directly to NEXT_PUBLIC_API_URL
 * (the Railway backend URL) using credentials:include. The proxy is still
 * used for server-side requests (SSR) so cookies are forwarded correctly.
 *
 * Cookie strategy:
 *   - Development: sameSite=lax, secure=false  — works via proxy
 *   - Production:  sameSite=none, secure=true   — works cross-domain
 */

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

export async function GET(request, { params }) {
  return proxyRequest(request, params.path, "GET");
}
export async function POST(request, { params }) {
  return proxyRequest(request, params.path, "POST");
}
export async function PUT(request, { params }) {
  return proxyRequest(request, params.path, "PUT");
}
export async function PATCH(request, { params }) {
  return proxyRequest(request, params.path, "PATCH");
}
export async function DELETE(request, { params }) {
  return proxyRequest(request, params.path, "DELETE");
}

async function proxyRequest(request, pathSegments, method) {
  const path   = Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments;
  const search = request.nextUrl.search ?? "";
  const url    = `${BACKEND}/api/${path}${search}`;

  // Forward all original headers except host
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "host" && lower !== "x-forwarded-host") {
      forwardHeaders.set(key, value);
    }
  });

  // Read body only for methods that carry one
  let body = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
      forwardHeaders.delete("content-type");
    } else {
      body = await request.text();
    }
  }

  let backendRes;
  try {
    backendRes = await fetch(url, {
      method,
      headers: forwardHeaders,
      body,
      credentials: "include",
      redirect: "manual",
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Backend unreachable." }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }

  // Copy ALL response headers (including Set-Cookie) to the reply
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!["transfer-encoding", "connection"].includes(lower)) {
      responseHeaders.append(key, value);
    }
  });

  const responseBody = await backendRes.arrayBuffer();

  return new Response(responseBody, {
    status:  backendRes.status,
    headers: responseHeaders,
  });
}
