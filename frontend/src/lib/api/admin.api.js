import apiFetch from "@/lib/api-client";

export const adminApi = {
  /**
   * GET /api/admin/users
   * Liste paginée des utilisateurs (admin uniquement).
   * @param {{ q?, role?, status?, page?, limit? }} params
   * @param {string} token
   */
  getUsers: async (params = {}, token) => {
    const qs = new URLSearchParams();
    if (params.q)      qs.set("q",      params.q);
    if (params.role)   qs.set("role",   params.role);
    if (params.status) qs.set("status", params.status);
    if (params.page)   qs.set("page",   String(params.page));
    if (params.limit)  qs.set("limit",  String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/admin/users${query}`, { token });
  },

  /**
   * PATCH /api/admin/users/:id/ban
   * Bannit un utilisateur.
   * @param {string} id
   * @param {string} token
   */
  banUser: async (id, token) => {
    return apiFetch(`/admin/users/${id}/ban`, { method: "PATCH", token });
  },

  /**
   * PATCH /api/admin/users/:id/unban
   * Réactive un utilisateur banni.
   * @param {string} id
   * @param {string} token
   */
  unbanUser: async (id, token) => {
    return apiFetch(`/admin/users/${id}/unban`, { method: "PATCH", token });
  },

  /**
   * GET /api/admin/metrics
   * Métriques globales de la plateforme.
   * @param {string} token
   */
  getMetrics: async (token) => {
    return apiFetch("/admin/metrics", { token });
  },
};
