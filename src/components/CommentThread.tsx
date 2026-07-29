"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "@/lib/useSound";

export type ThreadComment = {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRole: "STUDENT" | "STAFF" | "SOCIAL_WORKER" | "ADMIN";
  body: string;
  createdAt: string;
};

const ROLE_STYLE: Record<string, { bubble: string; label: string; tag: string }> = {
  STUDENT: { bubble: "bg-amber text-white", label: "text-amber-burnt", tag: "Class rep" },
  SOCIAL_WORKER: { bubble: "bg-sky text-white", label: "text-sky-deep", tag: "Social worker" },
  ADMIN: { bubble: "bg-ink text-white", label: "text-ink", tag: "Admin" },
  STAFF: { bubble: "bg-ink text-white", label: "text-ink", tag: "Staff" },
};

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CommentThread({
  comments,
  currentUserId,
  canReply,
  placeholder = "Write a message…",
  onSend,
  emptyLabel = "No messages yet.",
  compact = false,
}: {
  comments: ThreadComment[];
  currentUserId?: string;
  canReply: boolean;
  placeholder?: string;
  onSend: (body: string) => Promise<void>;
  emptyLabel?: string;
  compact?: boolean;
}) {
  const play = useSound();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [comments.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
      play("success");
    } catch {
      play("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className={`flex flex-col gap-2 overflow-y-auto rounded-xl bg-cream/70 p-3 ${
          compact ? "max-h-48" : "max-h-72"
        }`}
      >
        {comments.length === 0 && (
          <p className="py-4 text-center text-xs text-ink/40">{emptyLabel}</p>
        )}
        {comments.map((c) => {
          const mine = currentUserId && c.authorUserId === currentUserId;
          const style = ROLE_STYLE[c.authorRole] || ROLE_STYLE.STAFF;
          return (
            <div key={c.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className={`mb-0.5 px-1 text-[10px] font-semibold ${style.label}`}>
                {c.authorName} · {style.tag}
              </span>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine ? `${style.bubble} rounded-br-sm` : "bg-white text-ink rounded-bl-sm border border-ink/10"
                }`}
              >
                {c.body}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-ink/35">{timeLabel(c.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canReply && (
        <div className="mt-2 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="min-h-[42px] flex-1 resize-none rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-sky text-white shadow-pop transition-transform hover:scale-105 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Send message"
          >
            {sending ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 -rotate-45 translate-x-[1px]">
                <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
