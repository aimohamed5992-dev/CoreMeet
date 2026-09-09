import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth/AuthContext";
import { meetingsApi, parseMeetingCode } from "../lib/meetings/meetingsApi";
import type { MeetingSummary } from "../lib/meetings/types";
import { errorMessage } from "../lib/api";
import { timeAgo } from "../lib/datetime";
import Avatar from "../components/Avatar";
import EditableMeetingTitle from "./meeting/EditableMeetingTitle";
import EmptyMeetings from "../components/EmptyMeetings";
import { ArrowRightIcon, KeyboardIcon, ShieldIcon, VideoPlusIcon } from "../components/icons";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<MeetingSummary[] | null>(null);

  useEffect(() => {
    meetingsApi.listMine().then(setRecent).catch(() => setRecent([]));
  }, []);

  const rename = async (code: string, title: string) => {
    setRecent((prev) =>
      prev?.map((m) => (m.code === code ? { ...m, title } : m)) ?? prev,
    );
    try {
      await meetingsApi.rename(code, title);
    } catch {
      meetingsApi.listMine().then(setRecent).catch(() => undefined); // resync on failure
    }
  };

  const newMeeting = async () => {
    setError(null);
    setCreating(true);
    try {
      const meeting = await meetingsApi.create(t("dashboard.newMeeting"));
      navigate(`/meeting/${meeting.code}`);
    } catch (e) {
      setError(errorMessage(e, "errors.startMeetingFailed", t));
      setCreating(false);
    }
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseMeetingCode(code);
    if (parsed) navigate(`/meeting/${parsed}`);
  };

  const h = new Date().getHours();
  const greeting =
    h < 12 ? t("dashboard.greetingMorning") : h < 18 ? t("dashboard.greetingAfternoon") : t("dashboard.greetingEvening");

  return (
    <div className="dash">
      <header className="dash__greeting">
        <h1>{t("dashboard.greetingLine", { greeting, name: user?.name.split(" ")[0] ?? "" })}</h1>
        <p>{t("dashboard.subtitle")}</p>
      </header>

      <section className="dash__start card">
        <div className="dash__start-main">
          <button className="btn btn--primary btn--lg dash__new" onClick={newMeeting} disabled={creating}>
            <VideoPlusIcon /> {creating ? t("dashboard.starting") : t("dashboard.newMeeting")}
          </button>
          <span className="dash__or">{t("dashboard.or")}</span>
          <form className="dash__join" onSubmit={join}>
            <KeyboardIcon className="dash__join-icon" />
            <input
              className="dash__join-input"
              placeholder={t("dashboard.joinPlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label={t("dashboard.joinAria")}
            />
            <button type="submit" className="btn btn--ghost" disabled={!code.trim()}>
              {t("dashboard.join")} <ArrowRightIcon width={16} height={16} />
            </button>
          </form>
        </div>
        {error && <p className="dash__error">{error}</p>}
        <p className="dash__safe">
          <ShieldIcon width={16} height={16} />
          {t("dashboard.safe")}
        </p>
      </section>

      <section className="dash__recent">
        <h2>{t("dashboard.recent")}</h2>
        {recent === null ? (
          <div className="dash__recent-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="dash__meeting card dash__meeting--skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="dash__empty card">
            <EmptyMeetings className="dash__empty-art" />
            <div>
              <h3>{t("dashboard.noMeetingsTitle")}</h3>
              <p>{t("dashboard.noMeetingsText")}</p>
              <button className="btn btn--primary" onClick={newMeeting} disabled={creating}>
                <VideoPlusIcon /> {t("dashboard.startFirst")}
              </button>
            </div>
          </div>
        ) : (
          <ul className="dash__recent-list">
            {recent.map((m) => (
              <li key={m.id} className="dash__meeting card">
                <div className="dash__meeting-icon" style={{ background: m.status === 2 ? "var(--ink-200)" : "var(--brand-50)" }}>
                  <VideoPlusIcon />
                </div>
                <div className="dash__meeting-body">
                  <EditableMeetingTitle
                    title={m.title}
                    canEdit={m.status !== 2 && !!user && m.hostId === user.id}
                    onRename={(title) => rename(m.code, title)}
                    tooltipKey="dashboard.renameTitle"
                    className="dash__meeting-rename"
                    inputClassName="dash__meeting-rename-input"
                  />
                  <span className="dash__meeting-meta">
                    {m.code} · {m.status === 2 ? t("dashboard.statusEnded") : t("dashboard.statusActive")} · {timeAgo(m.createdAt)}
                  </span>
                </div>
                <div className="dash__meeting-people">
                  {m.participantCount > 0 && (
                    <span className="dash__count">
                      <Avatar user={{ name: m.hostName, avatarColor: "#1FA84C" }} size={22} />
                      {m.participantCount}
                    </span>
                  )}
                  <button
                    className="btn btn--ghost"
                    onClick={() => navigate(`/meeting/${m.code}`)}
                    disabled={m.status === 2}
                  >
                    {m.status === 2 ? t("dashboard.endedBtn") : t("dashboard.rejoin")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
