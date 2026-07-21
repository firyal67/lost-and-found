"use client";
/**
 * socket.js — Singleton Socket.IO client
 * ─────────────────────────────────────────────────────────────────────────────
 * Keeps a single socket instance across the app lifetime.
 * Must be used only in browser context (never in SSR/server components).
 *
 * Usage:
 *   import { getSocket, disconnectSocket } from "@/lib/socket";
 *   const socket = getSocket(accessToken);
 *   socket.on("new_message", handler);
 *   disconnectSocket();   // call on page unmount
 */

import { io } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000")
    : "http://localhost:5000";

/** @type {import("socket.io-client").Socket | null} */
let _socket = null;

/**
 * Returns (or creates) the shared Socket.IO client.
 * Re-creates the socket if the access token changed.
 *
 * @param {string} token  — current access token (JWT)
 * @returns {import("socket.io-client").Socket}
 */
export function getSocket(token) {
  if (_socket && _socket.connected && _socket._authToken === token) {
    return _socket;
  }

  // Disconnect stale socket before creating a new one
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(SOCKET_URL, {
    auth:           { token },
    transports:     ["websocket", "polling"],
    reconnection:    true,
    reconnectionAttempts: 8,
    reconnectionDelay:    1000,
    reconnectionDelayMax: 10000,
    timeout:         20000,
    autoConnect:     true,
  });

  // Tag for token-change detection
  _socket._authToken = token;

  _socket.on("connect", () => {
    console.debug("[socket] connected:", _socket.id);
  });
  _socket.on("disconnect", (reason) => {
    console.debug("[socket] disconnected:", reason);
  });
  _socket.on("connect_error", (err) => {
    console.warn("[socket] connect error:", err.message);
  });

  return _socket;
}

/**
 * Disconnect and destroy the shared socket.
 * Call this when the user logs out or the app unmounts.
 */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

/**
 * Returns the current socket or null (no side-effects).
 */
export function peekSocket() {
  return _socket;
}
