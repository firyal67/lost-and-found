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
   * PATCH /api/posts/:id
   * Met à jour une annonce existante (owner ou admin).
   * @param {string} id      - ID de l'annonce
   * @param {Object} payload - Champs à mettre à jour
   * @param {string} token   - Access token JWT
   */
  updatePost: async (id, payload, token) => {
    return apiFetch(`/posts/${id}`, {
      method: "PATCH",
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
   * GET /api/posts/matches
   * Suggestions de correspondance lors de la création d'une annonce.
   * @param {Object} params - { type, objectType, city, date }
   */
  getMatchingSuggestions: async ({ type, objectType, city, delegation, date, title, description }) => {
    const qs = new URLSearchParams();
    if (type)        qs.set("type",        type);
    if (objectType)  qs.set("objectType",  objectType);
    if (city)        qs.set("city",        city);
    if (delegation)  qs.set("delegation",  delegation);
    if (date)        qs.set("date",        date);
    if (title)       qs.set("title",       title);
    if (description) qs.set("description", description);
    return apiFetch(`/posts/matches?${qs.toString()}`);
  },

  /**
   * GET /api/posts/:id/matches
   * Correspondances pour une annonce existante (page de détail).
   * @param {string} id - ID de l'annonce
   */
  getPostMatches: async (id) => {
    return apiFetch(`/posts/${id}/matches`);
  },

  /**
   * PATCH /api/posts/:id/match
   * Marque une annonce comme mise en correspondance (status = matched).
   * @param {string} id            - ID de l'annonce
   * @param {string} token         - Access token JWT
   * @param {string} [matchedWith] - ID de l'annonce correspondante (optionnel)
   */
  matchPost: async (id, token, matchedWith = null) => {
    return apiFetch(`/posts/${id}/match`, {
      method: "PATCH",
      token,
      body: JSON.stringify(matchedWith ? { matchedWith } : {}),
    });
  },

  /**
   * PATCH /api/posts/:id/archive
   * Archive une annonce (owner ou admin).
   * @param {string} id    - ID de l'annonce
   * @param {string} token - Access token JWT
   */
  archivePost: async (id, token) => {
    return apiFetch(`/posts/${id}/archive`, {
      method: "PATCH",
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
