/**
 * Next.js catch-all API route proxy.
 *
 * Forwards every /api/* request to the Express backend and relays
 * ALL response headers — including Set-Cookie — back to the browser.
 *
 * This replaces the next.config.mjs rewrite which silently drops
 * Set-Cookie headers, causing the refreshToken cookie to never
 * reach the browser and breaking session persistence.
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
  const path   = pathSegments.join("/");
  const search = request.nextUrl.search ?? "";
  const url    = `${BACKEND}/api/${path}${search}`;

  // Forward all original headers except host
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      forwardHeaders.set(key, value);
    }
  });

  // Read body only for methods that carry one
  let body = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Let fetch handle multipart boundaries — don't set Content-Type manually
      body = await request.formData();
      forwardHeaders.delete("content-type");
    } else {
      body = await request.text();
    }
  }

  const backendRes = await fetch(url, {
    method,
    headers: forwardHeaders,
    body,
    // Required so the backend's refreshToken cookie reaches the backend
    credentials: "include",
    // Don't follow redirects — pass them through
    redirect: "manual",
  });

  // Copy ALL response headers (including Set-Cookie) to the reply
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    // The Next.js edge runtime forbids setting these directly
    if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
      responseHeaders.append(key, value);
    }
  });

  const responseBody = await backendRes.arrayBuffer();

  return new Response(responseBody, {
    status:  backendRes.status,
    headers: responseHeaders,
  });
}
