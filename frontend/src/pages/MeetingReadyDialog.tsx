import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LinkIcon, CheckIcon } from "../components/icons";
import "./MeetingReadyDialog.css";

/** Shown after "Create a meeting for later" — the link to copy/share, or join right away. */
export default function MeetingReadyDialog({
  title,
  code,
  onJoin,
  onClose,
}: {
  title: string;
  code: string;
  onJoin: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}/meeting/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the link is still selectable/visible */
    }
  };

  return (
    <div className="ready-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="ready-dialog card"
        role="dialog"
        aria-modal="true"
        aria-label={t("dashboard.readyTitle")}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="ready-dialog__close" onClick={onClose} aria-label={t("common.close")}>
          ×
        </button>
        <h2>{t("dashboard.readyTitle")}</h2>
        <p className="ready-dialog__sub">{title}</p>
        <div className="ready-dialog__link">
          <LinkIcon width={16} height={16} />
          <span>{link}</span>
        </div>
        <div className="ready-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={copy}>
            {copied ? (
              <>
                <CheckIcon width={16} height={16} /> {t("dashboard.linkCopied")}
              </>
            ) : (
              t("dashboard.copyLink")
            )}
          </button>
          <button type="button" className="btn btn--primary" onClick={onJoin}>
            {t("dashboard.joinNowBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
