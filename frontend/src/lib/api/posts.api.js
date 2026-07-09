import apiFetch from "@/lib/api-client";

export const postsApi = {
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
};
