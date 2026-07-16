// Always point directly at the backend API.
// In the browser during development, requests go through the Next.js rewrite
// proxy (/api → http://localhost:5000/api) to avoid CORS issues.
// On the server (SSR / server actions), window is undefined, so we use the
// full backend URL directly — the proxy is only available in the browser.
const BASE_URL = (() => {
  if (typeof window !== "undefined") {
    // Browser: use the Next.js proxy in all environments (avoids CORS)
    return "/api";
  }
  // Server-side: call the backend directly
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
})();

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

export async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Session expired.");
  return data.data.accessToken;
}

async function apiFetch(endpoint, options = {}) {
  const { token, _retry = false, ...fetchOptions } = options;

  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  // Guard: parse JSON safely — a non-running backend can return HTML
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(
      res.status >= 500
        ? "Le serveur est inaccessible. Veuillez réessayer dans quelques instants."
        : text || "Une erreur est survenue."
    );
  }

  if (res.ok) return data;

  if (res.status === 401 && data.code === "TOKEN_EXPIRED" && !_retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) =>
        apiFetch(endpoint, { ...options, token: newToken, _retry: true })
      );
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      return apiFetch(endpoint, { ...options, token: newToken, _retry: true });
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  const err = new Error(data.message || "Request failed");
  err.status = res.status;
  err.response = data;
  throw err;
}

export default apiFetch;
