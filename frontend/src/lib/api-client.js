const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

let isRefreshing = false;
// File d'attente des requêtes en attente pendant le refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

/**
 * Tente de renouveler l'access token via le cookie refresh token.
 * Retourne le nouveau access token ou lève une erreur.
 */
export async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Session expired.");
  return data.data.accessToken;
}

/**
 * Fetch wrapper avec :
 * - credentials: include (cookie httpOnly)
 * - Authorization: Bearer si token fourni
 * - Retry automatique sur 401 TOKEN_EXPIRED via refresh
 *
 * @param {string} endpoint  — ex: "/posts"
 * @param {object} options   — options fetch standard + { token?: string, _retry?: boolean }
 */
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

  const data = await res.json();

  // Succès
  if (res.ok) return data;

  // Si 401 TOKEN_EXPIRED et pas déjà en retry → tenter le refresh
  if (res.status === 401 && data.code === "TOKEN_EXPIRED" && !_retry) {
    if (isRefreshing) {
      // Mettre la requête en file d'attente
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
      // Déclencher un événement global pour que le store Redux déconnecte l'user
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  // Autres erreurs
  const err = new Error(data.message || "Request failed");
  err.status = res.status;
  err.response = data;
  throw err;
}

export default apiFetch;
