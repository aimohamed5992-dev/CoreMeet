import { useTranslation } from "react-i18next";
import Avatar from "../../components/Avatar";
import { CloseIcon } from "../../components/meet-icons";
import type { Participant } from "../../lib/meetings/types";

export default function ParticipantsPanel({
  participants,
  hostId,
  meId,
  onClose,
}: {
  participants: Participant[];
  hostId?: string;
  meId?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const connected = participants.filter((p) => p.isConnected).length;
  const sorted = [...participants].sort(
    (a, b) => Number(b.isConnected) - Number(a.isConnected) || a.displayName.localeCompare(b.displayName),
  );

  const roleLabel = (p: Participant) =>
    p.userId === hostId && hostId ? t("common.host") : p.role === 1 ? t("common.coHost") : t("common.guest");

  return (
    <aside className="side">
      <header className="side__head">
        <h2>{t("people.title", { count: connected })}</h2>
        <button className="side__close" onClick={onClose} aria-label={t("common.close")}>
          <CloseIcon width={18} height={18} />
        </button>
      </header>
      <ul className="side__list">
        {sorted.map((p) => (
          <li key={p.id} className="side__person">
            <Avatar user={{ name: p.displayName, avatarColor: p.avatarColor, avatarUrl: p.avatarUrl }} size={34} />
            <div className="side__person-body">
              <span>
                {p.displayName}
                {p.id === meId ? t("common.youParen") : ""}
              </span>
              <small>
                {roleLabel(p)}
                {!p.isConnected && ` · ${t("common.offline")}`}
              </small>
            </div>
            <span className={`side__dot ${p.isConnected ? "side__dot--on" : ""}`} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
