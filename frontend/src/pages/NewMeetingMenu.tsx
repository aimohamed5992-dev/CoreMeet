import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { VideoPlusIcon, LinkIcon, CalendarIcon, ChevronDownIcon } from "../components/icons";
import "./NewMeetingMenu.css";

/** The "New meeting" button + its dropdown (create for later / start now / schedule). */
export default function NewMeetingMenu({
  busy,
  onInstant,
  onForLater,
  onSchedule,
}: {
  busy: boolean;
  onInstant: () => void;
  onForLater: () => void;
  onSchedule: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="new-meet" ref={ref}>
      <button
        type="button"
        className="btn btn--primary dash__new"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <VideoPlusIcon /> {busy ? t("dashboard.starting") : t("dashboard.newMeeting")}
        <ChevronDownIcon className="new-meet__chevron" width={16} height={16} />
      </button>
      {open && (
        <div className="new-meet__menu card" role="menu">
          <button type="button" className="new-meet__item" role="menuitem" onClick={() => pick(onForLater)}>
            <LinkIcon width={18} height={18} />
            <span>{t("dashboard.createForLater")}</span>
          </button>
          <button type="button" className="new-meet__item" role="menuitem" onClick={() => pick(onInstant)}>
            <VideoPlusIcon width={18} height={18} />
            <span>{t("dashboard.startInstant")}</span>
          </button>
          <button type="button" className="new-meet__item" role="menuitem" onClick={() => pick(onSchedule)}>
            <CalendarIcon width={18} height={18} />
            <span>{t("dashboard.scheduleCalendar")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
