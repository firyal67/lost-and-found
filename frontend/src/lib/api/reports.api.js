import apiFetch from "@/lib/api-client";

export const reportsApi = {
  /**
   * POST /api/reports
   * Signaler une annonce (spam, arnaque, etc.).
   * @param {{ postId: string, reason: string, comment?: string }} payload
   * @param {string} token - Access token JWT
   */
  createReport: async (payload, token) => {
    return apiFetch("/reports", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/reports/mine
   * Retourne les signalements envoyés par l'utilisateur connecté.
   * @param {string} token - Access token JWT
   */
  getMyReports: async (token) => {
    return apiFetch("/reports/mine", { token });
  },

  /**
   * GET /api/reports/post/:postId/mine
   * Vérifie si l'utilisateur a déjà signalé une annonce donnée.
   * @param {string} postId
   * @param {string} token - Access token JWT
   */
  getReportForPost: async (postId, token) => {
    return apiFetch(`/reports/post/${postId}/mine`, { token });
  },

  /**
   * GET /api/reports
   * Liste tous les signalements (admin uniquement).
   * @param {{ status?: string, page?: number, limit?: number }} params
   * @param {string} token - Access token JWT
   */
  getReports: async (params = {}, token) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.page)   qs.set("page",   String(params.page));
    if (params.limit)  qs.set("limit",  String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/reports${query}`, { token });
  },

  /**
   * PATCH /api/reports/:id/status
   * Met à jour le statut d'un signalement (admin uniquement).
   * @param {string} id - ID du signalement
   * @param {{ status: string, adminNote?: string }} payload
   * @param {string} token - Access token JWT
   */
  updateReportStatus: async (id, payload, token) => {
    return apiFetch(`/reports/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },

  /**
   * DELETE /api/reports/:id/post
   * Supprime l'annonce liée au signalement et clôture tous ses signalements (admin uniquement).
   * @param {string} id    - ID du signalement
   * @param {string} token - Access token JWT
   */
  deleteReportedPost: async (id, token) => {
    return apiFetch(`/reports/${id}/post`, {
      method: "DELETE",
      token,
    });
  },
};
