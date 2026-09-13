import { useTranslation } from "react-i18next";
import type { AgentStatus } from "../../lib/meetings/useControlAgent";

/**
 * Target-side control UI: the consent prompt for an incoming request, and the
 * persistent "your screen is being controlled" bar with an instant Stop.
 */
export default function ControlBanner({
  incomingRequest,
  onRespond,
  controlledBy,
  onStop,
  agentStatus,
}: {
  incomingRequest: { name: string } | null;
  onRespond: (granted: boolean) => void;
  controlledBy: { name: string } | null;
  onStop: () => void;
  agentStatus: AgentStatus;
}) {
  const { t } = useTranslation();

  if (controlledBy) {
    return (
      <div className="ctl-bar" role="status">
        <span className="ctl-bar__dot" aria-hidden />
        <span className="ctl-bar__text">
          {t("control.beingControlled", { name: controlledBy.name || t("common.guest") })}
        </span>
        {agentStatus === "absent" && (
          <span className="ctl-bar__hint">{t("control.agentMissing")}</span>
        )}
        <button className="ctl-bar__stop" onClick={onStop}>
          {t("control.stop")}
        </button>
      </div>
    );
  }

  if (incomingRequest) {
    return (
      <div className="ctl-prompt" role="alertdialog" aria-label={t("control.requestTitle")}>
        <div className="ctl-prompt__body">
          <strong>{t("control.requestTitle")}</strong>
          <p>{t("control.requestBody", { name: incomingRequest.name || t("common.guest") })}</p>
          {agentStatus === "absent" && (
            <p className="ctl-prompt__warn">{t("control.agentMissingLong")}</p>
          )}
        </div>
        <div className="ctl-prompt__actions">
          <button className="btn btn--ghost" onClick={() => onRespond(false)}>
            {t("control.deny")}
          </button>
          <button className="btn btn--primary" onClick={() => onRespond(true)}>
            {t("control.allow")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
