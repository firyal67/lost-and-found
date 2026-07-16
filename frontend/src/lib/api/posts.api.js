import apiFetch from "@/lib/api-client";

export const postsApi = {
  /**
   * GET /api/posts
   * Liste des annonces avec filtres et pagination.
   * @param {URLSearchParams|string} params - query string
   */
  getPosts: async (params = "") => {
    const qs = params ? `?${params}` : "";
    return apiFetch(`/posts${qs}`);
  },

  /**
   * GET /api/posts/:id
   * Détail d'une annonce.
   */
  getPostById: async (id) => {
    return apiFetch(`/posts/${id}`);
  },

  /**
   * POST /api/posts
   * Crée une nouvelle annonce (objet perdu ou trouvé).
   * @param {Object} payload - Données du formulaire
   * @param {string} token   - Access token JWT
   */
  createPost: async (payload, token) => {
    return apiFetch("/posts", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  /**
   * POST /api/contacts
   * Envoyer une demande de contact pour une annonce.
   * @param {string} postId   - ID de l'annonce
   * @param {string} message  - Message optionnel
   * @param {string} token    - Access token JWT
   */
  createContactRequest: async ({ postId, message }, token) => {
    return apiFetch("/contacts", {
      method: "POST",
      token,
      body: JSON.stringify({ postId, message }),
    });
  },
  /**
   * DELETE /api/posts/:id
   * Supprime une annonce (owner ou admin).
   * @param {string} id    - ID de l'annonce
   * @param {string} token - Access token JWT
   */
  deletePost: async (id, token) => {
    return apiFetch(`/posts/${id}`, {
      method: "DELETE",
      token,
    });
  },

  /**
   * PATCH /api/posts/:id/resolve
   * Clôture une annonce résolue (owner ou admin).
   * @param {string} id    - ID de l'annonce
   * @param {string} token - Access token JWT
   */
  resolvePost: async (id, token) => {
    return apiFetch(`/posts/${id}/resolve`, {
      method: "PATCH",
      token,
    });
  },
};
