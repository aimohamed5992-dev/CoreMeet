import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The meeting title in the room header. Plain text for guests; for the host it
 * turns into an inline input on click and saves on Enter / blur.
 */
export default function EditableMeetingTitle({
  title,
  canEdit,
  onRename,
  tooltipKey = "room.renameTitle",
  className = "room__title-edit",
  inputClassName = "room__title-input",
}: {
  title: string;
  canEdit: boolean;
  onRename: (title: string) => void;
  tooltipKey?: string;
  className?: string;
  inputClassName?: string;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    setEditing(false);
  };

  if (!canEdit) return <strong>{title}</strong>;

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={inputClassName}
        value={draft}
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(title);
            setEditing(false);
          }
        }}
        aria-label={t(tooltipKey)}
      />
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setEditing(true)}
      title={t(tooltipKey)}
    >
      <strong>{title}</strong>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
