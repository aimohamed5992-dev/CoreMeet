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
  const sorted = [...participants].sort(
    (a, b) => Number(b.isConnected) - Number(a.isConnected) || a.displayName.localeCompare(b.displayName),
  );

  return (
    <aside className="side">
      <header className="side__head">
        <h2>People ({participants.filter((p) => p.isConnected).length})</h2>
        <button className="side__close" onClick={onClose} aria-label="Close">
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
                {p.id === meId ? " (you)" : ""}
              </span>
              <small>
                {p.userId === hostId && hostId ? "Host" : p.role === 1 ? "Co-host" : "Guest"}
                {!p.isConnected && " · offline"}
              </small>
            </div>
            <span className={`side__dot ${p.isConnected ? "side__dot--on" : ""}`} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
