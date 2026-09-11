import { useTranslation } from "react-i18next";
import Avatar from "../../components/Avatar";
import type { JoinRequestItem } from "../../lib/meetings/useMeetingRoom";

/** Host-only: people knocking to join, with Admit / Deny per request. */
export default function JoinRequestsBar({
  requests,
  onAdmit,
}: {
  requests: JoinRequestItem[];
  onAdmit: (connectionId: string, granted: boolean) => void;
}) {
  const { t } = useTranslation();

  if (requests.length === 0) return null;

  return (
    <div className="join-prompt" role="alert" aria-label={t("room.joinRequestsTitle")}>
      <strong className="join-prompt__title">
        {t("room.joinRequestsTitle", { count: requests.length })}
      </strong>
      <ul className="join-prompt__list">
        {requests.map((r) => (
          <li key={r.connectionId} className="join-prompt__row">
            <Avatar user={{ name: r.displayName, avatarColor: r.avatarColor, avatarUrl: r.avatarUrl }} size={32} />
            <span className="join-prompt__name">{r.displayName}</span>
            <div className="join-prompt__actions">
              <button className="btn btn--ghost" onClick={() => onAdmit(r.connectionId, false)}>
                {t("room.deny")}
              </button>
              <button className="btn btn--primary" onClick={() => onAdmit(r.connectionId, true)}>
                {t("room.admit")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
