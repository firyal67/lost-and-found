"use client";

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, Send, ArrowLeft, MessageSquare, User,
  AlertCircle, WifiOff, Wifi, ChevronUp,
} from "lucide-react";
import { chatApi }       from "@/lib/api/chat.api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken }                from "@/store/slices/authSlice";
import { refreshAccessToken }            from "@/lib/api-client";
import { contactsApi }  from "@/lib/api/contacts.api";

/* ── style tokens ────────────────────────────────────────────────────────── */
const C = {
  canvas:   "#0d0f14",
  surface:  "#13161e",
  elevated: "#1a1e28",
  border:   "rgba(255,255,255,0.08)",
  borderS:  "rgba(255,255,255,0.05)",
  ink:      "#f0f2f8",
  inkSec:   "#b8bdd0",
  inkMut:   "#6b7494",
  accent:   "#4f8ef7",
  accentSub:"rgba(79,142,247,0.12)",
  success:  "#34d399",
  danger:   "#f87171",
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" });
}
function formatDay(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-TN", { weekday: "long", day: "numeric", month: "long" });
}
function groupByDay(messages) {
  const groups = [];
  let lastDay  = null;
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== lastDay) { groups.push({ type: "divider", day }); lastDay = day; }
    groups.push({ type: "message", ...m });
  }
  return groups;
}

/* ── TypingIndicator ─────────────────────────────────────────────────────── */
function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2 mb-2 ml-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
        style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
        <User className="h-3.5 w-3.5" style={{ color: C.inkMut }} />
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm"
        style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: C.inkMut, animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: C.inkMut, animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: C.inkMut, animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

/* ── MessageBubble ───────────────────────────────────────────────────────── */
function MessageBubble({ msg, isMine, showSender }) {
  const isOptimistic = msg._optimistic;
  const hasFailed    = msg._failed;

  return (
    <div className={`flex items-end gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {!isMine && (
        <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mb-0.5"
          style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
          <span className="text-[10px] font-[700]" style={{ color: C.inkSec }}>
            {(msg.sender?.name ?? "?")[0].toUpperCase()}
          </span>
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        {showSender && !isMine && (
          <span className="text-[11px] font-[600] ml-1 mb-0.5" style={{ color: C.inkMut }}>
            {msg.sender?.name ?? "Utilisateur"}
          </span>
        )}

        <div
          className="px-3.5 py-2.5 rounded-2xl text-[14px] leading-[1.55] break-words"
          style={{
            background:   isMine
              ? (hasFailed ? "rgba(248,113,113,0.18)" : C.accent)
              : C.elevated,
            color:        isMine
              ? (hasFailed ? C.danger : "#fff")
              : C.ink,
            borderRadius: isMine
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            border:       isMine
              ? (hasFailed ? `1px solid rgba(248,113,113,0.35)` : "none")
              : `1px solid ${C.borderS}`,
            opacity:      isOptimistic && !hasFailed ? 0.7 : 1,
          }}
        >
          {msg.content}
        </div>

        <span className="text-[10px] mx-1" style={{ color: C.inkMut }}>
          {hasFailed
            ? <span style={{ color: C.danger }}>Échec — réessayez</span>
            : isOptimistic
            ? "Envoi…"
            : formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const { contactId } = useParams();
  const router        = useRouter();
  const dispatch      = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [socketStatus,  setSocketStatus]  = useState("connecting"); // connecting | connected | disconnected
  const [otherTyping,   setOtherTyping]   = useState(false);
  const [otherName,     setOtherName]     = useState("");
  const [contact,       setContact]       = useState(null);
  const [hasMore,       setHasMore]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const typingTimer  = useRef(null);
  const socketRef    = useRef(null);
  const tokenRef     = useRef(accessToken);

  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  /* ── Get fresh token ───────────────────────────────────────────────────── */
  const getToken = useCallback(async () => {
    if (tokenRef.current) return tokenRef.current;
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    tokenRef.current = t;
    return t;
  }, [dispatch]);

  /* ── Redirect if not logged in ─────────────────────────────────────────── */
  useEffect(() => {
    if (!user && !accessToken) {
      router.push(`/auth/login?redirect=/dashboard/chat/${contactId}`);
    }
  }, [user, accessToken, contactId, router]);

  /* ── Load contact info + message history ───────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();

        // Load contact to display names
        const contactData = await contactsApi.getMyContacts({}, token);
        const found = (contactData?.data?.contacts ?? []).find(
          (c) => c._id === contactId
        );
        if (!cancelled && found) {
          setContact(found);
          const userId = user?._id ?? user?.id;
          const other = found.owner?._id?.toString() === userId?.toString()
            ? found.requester
            : found.owner;
          setOtherName(other?.name ?? "Utilisateur");
        }

        // Load messages
        const histData = await chatApi.getMessages(contactId, token);
        if (!cancelled) {
          const msgs = histData?.data?.messages ?? [];
          setMessages(msgs);
          setHasMore(msgs.length === 50);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Impossible de charger la conversation.");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [contactId, getToken, user]);

  /* ── Scroll to bottom when messages change ─────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  /* ── Socket.IO connection ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!accessToken || !contactId) return;

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    const onConnect = () => {
      setSocketStatus("connected");
      socket.emit("join_conversation", { contactId });
    };
    const onDisconnect = () => setSocketStatus("disconnected");
    const onError      = ()  => setSocketStatus("disconnected");

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        // Replace optimistic message if same tempId
        if (msg.tempId) {
          const idx = prev.findIndex((m) => m._tempId === msg.tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...msg, _optimistic: false };
            return next;
          }
        }
        // Avoid duplicates
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark typing as done when a message arrives
      setOtherTyping(false);
    };

    const onTyping = ({ isTyping }) => {
      setOtherTyping(isTyping);
    };

    const onMessageError = ({ tempId, error }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._tempId === tempId ? { ...m, _optimistic: false, _failed: true } : m
        )
      );
      toast.error(error || "Échec de l'envoi.");
    };

    socket.on("connect",       onConnect);
    socket.on("disconnect",    onDisconnect);
    socket.on("connect_error", onError);
    socket.on("new_message",   onNewMessage);
    socket.on("typing",        onTyping);
    socket.on("message_error", onMessageError);

    // If already connected, join immediately
    if (socket.connected) onConnect();

    return () => {
      socket.emit("leave_conversation", { contactId });
      socket.off("connect",       onConnect);
      socket.off("disconnect",    onDisconnect);
      socket.off("connect_error", onError);
      socket.off("new_message",   onNewMessage);
      socket.off("typing",        onTyping);
      socket.off("message_error", onMessageError);
    };
  }, [accessToken, contactId]);

  /* ── Load older messages ───────────────────────────────────────────────── */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const token  = await getToken();
      const before = messages[0]?.createdAt;
      const data   = await chatApi.getMessages(contactId, token, before);
      const older  = data?.data?.messages ?? [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
    } catch {
      toast.error("Impossible de charger les messages précédents.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, contactId, getToken]);

  /* ── Typing indicator ──────────────────────────────────────────────────── */
  const emitTyping = useCallback((isTyping) => {
    socketRef.current?.emit("typing", { contactId, isTyping });
  }, [contactId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 2000);
  };

  /* ── Send message ──────────────────────────────────────────────────────── */
  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    emitTyping(false);
    clearTimeout(typingTimer.current);

    const tempId  = `temp_${Date.now()}_${Math.random()}`;
    const userId  = user?._id ?? user?.id;
    const optimistic = {
      _id:         tempId,
      _tempId:     tempId,
      _optimistic: true,
      content:     text,
      sender:      { _id: userId, name: user?.name },
      createdAt:   new Date().toISOString(),
      contact:     contactId,
    };

    setMessages((prev) => [...prev, optimistic]);

    // Try Socket.IO first
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", { contactId, content: text, tempId });
    } else {
      // REST fallback
      setSending(true);
      try {
        const token = await getToken();
        const data  = await chatApi.sendMessage(contactId, text, token);
        const saved = data?.data?.message;
        setMessages((prev) =>
          prev.map((m) => (m._tempId === tempId ? { ...saved } : m))
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m._tempId === tempId ? { ...m, _optimistic: false, _failed: true } : m))
        );
        toast.error("Échec de l'envoi. Réessayez.");
      } finally {
        setSending(false);
      }
    }

    inputRef.current?.focus();
  }, [input, sending, contactId, user, getToken, emitTyping]);

  /* ── Keyboard: Enter sends, Shift+Enter = newline ──────────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Grouped items for rendering ───────────────────────────────────────── */
  const items = useMemo(() => groupByDay(messages), [messages]);
  const userId = user?._id ?? user?.id;

  /* ── Conversation header info ──────────────────────────────────────────── */
  const postTitle = contact?.post?.title ?? "Conversation";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: C.canvas }}>
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>

        <Link href="/dashboard/contacts"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: C.inkMut }}>
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Avatar */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ background: C.accentSub, border: `1px solid rgba(79,142,247,0.22)` }}>
          <span className="text-[14px] font-[700]" style={{ color: C.accent }}>
            {otherName[0]?.toUpperCase() ?? "?"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-[700] truncate" style={{ color: C.ink }}>{otherName}</p>
          <p className="text-[11px] truncate" style={{ color: C.inkMut }}>{postTitle}</p>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {socketStatus === "connected"
            ? <Wifi     className="h-3.5 w-3.5" style={{ color: C.success }} />
            : <WifiOff  className="h-3.5 w-3.5" style={{ color: socketStatus === "connecting" ? C.inkMut : C.danger }} />}
          <span className="text-[11px]" style={{
            color: socketStatus === "connected" ? C.success : socketStatus === "connecting" ? C.inkMut : C.danger
          }}>
            {socketStatus === "connected" ? "En ligne" : socketStatus === "connecting" ? "Connexion…" : "Hors ligne"}
          </span>
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ background: C.canvas }}>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button onClick={loadMore} disabled={loadingMore}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-[500] transition-all"
              style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.inkSec }}>
              {loadingMore
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ChevronUp className="h-3.5 w-3.5" />}
              Messages précédents
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
              <MessageSquare className="h-7 w-7" style={{ color: C.inkMut }} />
            </div>
            <div>
              <p className="text-[15px] font-[600]" style={{ color: C.ink }}>Démarrez la conversation</p>
              <p className="text-[13px] mt-1" style={{ color: C.inkMut }}>
                Envoyez un message à {otherName}
              </p>
            </div>
          </div>
        )}

        {/* Message list */}
        {items.map((item, idx) => {
          if (item.type === "divider") {
            return (
              <div key={`div-${idx}`} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: C.borderS }} />
                <span className="text-[11px] font-[600] px-3 py-1 rounded-full"
                  style={{ color: C.inkMut, background: C.elevated, border: `1px solid ${C.borderS}` }}>
                  {formatDay(item.day)}
                </span>
                <div className="flex-1 h-px" style={{ background: C.borderS }} />
              </div>
            );
          }

          const isMine     = item.sender?._id?.toString() === String(userId) ||
                             item.sender?.toString()       === String(userId);
          const prevItem   = items[idx - 1];
          const showSender = !isMine && (
            !prevItem || prevItem.type === "divider" ||
            prevItem.sender?._id?.toString() !== item.sender?._id?.toString()
          );

          return (
            <MessageBubble
              key={item._id ?? item._tempId}
              msg={item}
              isMine={isMine}
              showSender={showSender}
            />
          );
        })}

        {/* Typing indicator */}
        {otherTyping && <TypingIndicator name={otherName} />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3 shrink-0"
        style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message à ${otherName}…`}
          maxLength={2000}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-[14px] leading-[1.5] focus:outline-none transition-all"
          style={{
            background:   C.elevated,
            border:       `1px solid ${C.border}`,
            color:        C.ink,
            maxHeight:    "120px",
            overflowY:    "auto",
          }}
          onFocus={(e)  => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px rgba(79,142,247,0.18)`; }}
          onBlur={(e)   => { e.target.style.borderColor = C.border;  e.target.style.boxShadow = "none"; }}
          onInput={(e)  => {
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
          style={{
            background:   input.trim() ? C.accent : C.elevated,
            border:       `1px solid ${input.trim() ? "transparent" : C.border}`,
          }}
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin text-white" />
            : <Send className="h-4 w-4" style={{ color: input.trim() ? "#fff" : C.inkMut }} />}
        </button>
      </form>
    </div>
  );
}
