import apiFetch from "@/lib/api-client";

export const chatApi = {
  /**
   * GET /api/chat/:contactId/messages
   * Historique paginé (50 messages max par appel).
   * @param {string}  contactId
   * @param {string}  token
   * @param {string}  [before]  — ISO date, pour charger des messages plus anciens
   */
  getMessages: async (contactId, token, before) => {
    const qs = new URLSearchParams({ limit: "50" });
    if (before) qs.set("before", before);
    return apiFetch(`/chat/${contactId}/messages?${qs.toString()}`, { token });
  },

  /**
   * POST /api/chat/:contactId/messages
   * Envoi via REST (fallback si Socket.IO n'est pas disponible).
   * @param {string} contactId
   * @param {string} content
   * @param {string} token
   */
  sendMessage: async (contactId, content, token) => {
    return apiFetch(`/chat/${contactId}/messages`, {
      method: "POST",
      token,
      body:   JSON.stringify({ content }),
    });
  },

  /**
   * GET /api/chat/:contactId/unread
   * Nombre de messages non lus dans une conversation.
   * @param {string} contactId
   * @param {string} token
   */
  getUnreadCount: async (contactId, token) => {
    return apiFetch(`/chat/${contactId}/unread`, { token });
  },
};
