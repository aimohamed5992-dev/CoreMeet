import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";
import { meetingsApi, parseMeetingCode } from "../lib/meetings/meetingsApi";
import type { MeetingSummary } from "../lib/meetings/types";
import { errorMessage } from "../lib/api";
import { timeAgo } from "../lib/datetime";
import Avatar from "../components/Avatar";
import EmptyMeetings from "../components/EmptyMeetings";
import { ArrowRightIcon, KeyboardIcon, ShieldIcon, VideoPlusIcon } from "../components/icons";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<MeetingSummary[] | null>(null);

  useEffect(() => {
    meetingsApi.listMine().then(setRecent).catch(() => setRecent([]));
  }, []);

  const newMeeting = async () => {
    setError(null);
    setCreating(true);
    try {
      const meeting = await meetingsApi.create();
      navigate(`/meeting/${meeting.code}`);
    } catch (e) {
      setError(errorMessage(e, "Could not start a meeting."));
      setCreating(false);
    }
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseMeetingCode(code);
    if (parsed) navigate(`/meeting/${parsed}`);
  };

  return (
    <div className="dash">
      <header className="dash__greeting">
        <h1>
          {greeting()}, {user?.name.split(" ")[0]}
        </h1>
        <p>Start a meeting of your own, or hop into one with a code.</p>
      </header>

      <section className="dash__start card">
        <div className="dash__start-main">
          <button className="btn btn--primary btn--lg dash__new" onClick={newMeeting} disabled={creating}>
            <VideoPlusIcon /> {creating ? "Starting…" : "New meeting"}
          </button>
          <span className="dash__or">or</span>
          <form className="dash__join" onSubmit={join}>
            <KeyboardIcon className="dash__join-icon" />
            <input
              className="dash__join-input"
              placeholder="Enter a code or link"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label="Meeting code or link"
            />
            <button type="submit" className="btn btn--ghost" disabled={!code.trim()}>
              Join <ArrowRightIcon width={16} height={16} />
            </button>
          </form>
        </div>
        {error && <p className="dash__error">{error}</p>}
        <p className="dash__safe">
          <ShieldIcon width={16} height={16} />
          Your meetings are private — no one joins a room unless you let them in.
        </p>
      </section>

      <section className="dash__recent">
        <h2>Recent meetings</h2>
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
              <h3>No meetings yet</h3>
              <p>Your recent rooms will show up here once you host or join one.</p>
              <button className="btn btn--primary" onClick={newMeeting} disabled={creating}>
                <VideoPlusIcon /> Start your first meeting
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
                  <strong>{m.title}</strong>
                  <span className="dash__meeting-meta">
                    {m.code} · {m.status === 2 ? "ended" : "active"} · {timeAgo(m.createdAt)}
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
                    {m.status === 2 ? "Ended" : "Rejoin"}
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
