import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "../../lib/meetings/types";
import { formatTime } from "../../lib/datetime";
import { CloseIcon, SendIcon } from "../../components/meet-icons";

export default function ChatPanel({
  messages,
  meId,
  onSend,
  onClose,
}: {
  messages: ChatMessage[];
  meId?: string;
  onSend: (content: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim()) {
      onSend(draft);
      setDraft("");
    }
  };

  return (
    <aside className="side">
      <header className="side__head">
        <h2>{t("chat.title")}</h2>
        <button className="side__close" onClick={onClose} aria-label={t("common.close")}>
          <CloseIcon width={18} height={18} />
        </button>
      </header>

      <div className="chat__log">
        {messages.length === 0 && <p className="chat__empty">{t("chat.empty")}</p>}
        {messages.map((m) => {
          const mine = m.senderParticipantId === meId;
          return (
            <div key={m.id} className={`chat__msg ${mine ? "chat__msg--mine" : ""}`}>
              {!mine && <span className="chat__from">{m.senderName}</span>}
              <span className="chat__bubble">{m.content}</span>
              <time>{formatTime(m.sentAt)}</time>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form className="chat__form" onSubmit={submit}>
        <input
          className="input"
          placeholder={t("chat.placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
        />
        <button className="chat__send" disabled={!draft.trim()} aria-label={t("chat.send")}>
          <SendIcon width={20} height={20} />
        </button>
      </form>
    </aside>
  );
}
