import apiFetch from "@/lib/api-client";

export const contactsApi = {
  /**
   * GET /api/contacts
   * Mes demandes de contact (owner ou requester).
   * @param {{ role?: 'owner'|'requester', status?: 'pending'|'approved'|'rejected' }} params
   * @param {string} token
   */
  getMyContacts: async ({ role, status } = {}, token) => {
    const qs = new URLSearchParams();
    if (role)   qs.set("role",   role);
    if (status) qs.set("status", status);
    const q = qs.toString();
    return apiFetch(`/contacts${q ? `?${q}` : ""}`, { token });
  },

  /**
   * GET /api/contacts/post/:postId
   * Vérifie si l'utilisateur a déjà envoyé une demande pour cette annonce.
   * @param {string} postId
   * @param {string} token
   */
  getContactForPost: async (postId, token) => {
    return apiFetch(`/contacts/post/${postId}`, { token });
  },

  /**
   * PATCH /api/contacts/:id/approve
   * Approuve une demande et révèle les coordonnées.
   * @param {string} id
   * @param {string} token
   */
  approveContact: async (id, token) => {
    return apiFetch(`/contacts/${id}/approve`, { method: "PATCH", token });
  },

  /**
   * PATCH /api/contacts/:id/reject
   * Rejette une demande.
   * @param {string} id
   * @param {string} token
   */
  rejectContact: async (id, token) => {
    return apiFetch(`/contacts/${id}/reject`, { method: "PATCH", token });
  },
};
