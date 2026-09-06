import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroIllustration from "../components/HeroIllustration";
import {
  ArrowRightIcon,
  BoltIcon,
  ChatIcon,
  KeyboardIcon,
  ScreenShareIcon,
  ShieldIcon,
  UsersIcon,
  VideoPlusIcon,
} from "../components/icons";
import "./LandingPage.css";

const features = [
  { icon: <BoltIcon />, title: "Instant meetings", text: "Start a call in one click and share the link. No downloads, no waiting rooms unless you want them." },
  { icon: <UsersIcon />, title: "Group video", text: "Peer-to-peer WebRTC video and audio with an adaptive tile grid that scales with the room." },
  { icon: <ScreenShareIcon />, title: "Screen sharing", text: "Present a tab, a window, or your whole screen with a single toggle." },
  { icon: <ChatIcon />, title: "In-call chat", text: "Send messages, links, and notes to everyone without leaving the meeting." },
  { icon: <ShieldIcon />, title: "Private by default", text: "Every room has a unique code and the host controls who gets in." },
  { icon: <KeyboardIcon />, title: "Join with a code", text: "Paste a code or a link and you are in — works the same on desktop and mobile." },
];

const steps = [
  { n: "01", title: "Sign in", text: "Create a free account with your email in seconds." },
  { n: "02", title: "New meeting", text: "Hit “New meeting” to spin up a room with its own code." },
  { n: "03", title: "Share & talk", text: "Send the link, admit people, and start the conversation." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (c) navigate(`/join/${encodeURIComponent(c)}`);
  };

  return (
    <div className="landing">
      {/* HERO */}
      <section className="landing__hero container">
        <div className="landing__hero-copy">
          <span className="eyebrow"><BoltIcon width={14} height={14} /> WebRTC video, reimagined</span>
          <h1>
            Meetings that start<br /> the moment you do.
          </h1>
          <p className="landing__lead">
            CoreMeet is a clean, fast place to meet. Create a room, share the code,
            and everyone is talking face to face — right in the browser.
          </p>

          <div className="landing__actions card">
            <button className="btn btn--primary btn--lg" onClick={() => navigate("/register")}>
              <VideoPlusIcon /> New meeting
            </button>
            <form className="landing__join" onSubmit={join}>
              <KeyboardIcon className="landing__join-icon" />
              <input
                className="landing__join-input"
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

          <p className="landing__note">
            Free to use · No credit card · <a href="/register">Create your account</a>
          </p>
        </div>

        <div className="landing__hero-art">
          <HeroIllustration />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="landing__section container">
        <header className="landing__section-head">
          <span className="eyebrow">Everything you need</span>
          <h2>A focused set of tools, done well.</h2>
        </header>
        <div className="landing__grid">
          {features.map((f) => (
            <article key={f.title} className="landing__feature card">
              <span className="landing__feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="landing__section container">
        <header className="landing__section-head">
          <span className="eyebrow">How it works</span>
          <h2>Three steps to your first call.</h2>
        </header>
        <ol className="landing__steps">
          {steps.map((s) => (
            <li key={s.n} className="landing__step card">
              <span className="landing__step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SECURITY / CTA */}
      <section id="security" className="landing__cta">
        <div className="container landing__cta-inner">
          <ShieldIcon width={40} height={40} />
          <h2>Your meeting is safe.</h2>
          <p>
            No one can join a meeting unless invited or admitted by the host.
            Media streams flow directly between participants.
          </p>
          <button className="btn btn--lg landing__cta-btn" onClick={() => navigate("/register")}>
            Get started free <ArrowRightIcon width={18} height={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
