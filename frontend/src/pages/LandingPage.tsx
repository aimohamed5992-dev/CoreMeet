import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../lib/auth/AuthContext";
import Reveal, { RevealGroup, RevealItem } from "../components/Reveal";
import CountUp from "../components/CountUp";
import BrandImage from "../components/BrandImage";
import {
  ArrowRightIcon, BoltIcon, ChatIcon, CheckIcon, ClockIcon, DeviceIcon, GlobeIcon,
  KeyboardIcon, LockIcon, MinusIcon, PlayIcon, PlusIcon, ScreenShareIcon, ShieldIcon,
  SparkleIcon, UsersIcon, VideoPlusIcon, WaveIcon,
} from "../components/icons";
import "./LandingPage.css";

const highlights = [
  {
    tag: "Group video",
    title: "Everyone in the room, in crisp HD",
    text: "Peer-to-peer WebRTC keeps latency low and your conversation private. The tile grid adapts as people come and go, with an active-speaker view when it gets busy.",
    points: ["Up to 8 people in a mesh call", "Adaptive layout", "Mic & camera state you can see at a glance"],
    image: "screenshare",
    icon: <UsersIcon />,
  },
  {
    tag: "Present",
    title: "Share your screen — it takes the stage",
    text: "Start presenting and your screen fills the room while everyone else slides into a neat side rail. Swap between a tab, a window, or the whole display without dropping the call.",
    points: ["One-click present", "No renegotiation stutter", "Others stay visible in the rail"],
    image: "phone_join",
    icon: <ScreenShareIcon />,
  },
  {
    tag: "Chat & people",
    title: "Talk on the side, without leaving",
    text: "Send links and notes in the in-call chat, see exactly who's connected, and let the host admit or remove people. Everything is right where you expect it.",
    points: ["Live participant roster", "Persistent in-call chat", "Host controls"],
    image: "celebrate",
    icon: <ChatIcon />,
  },
];

const features = [
  { icon: <BoltIcon />, title: "Instant meetings", text: "Hit New meeting and you're in. Share the code and people join in one click." },
  { icon: <KeyboardIcon />, title: "Join with a code", text: "Paste a code or a link — no app, no account needed to join a call." },
  { icon: <DeviceIcon />, title: "Works everywhere", text: "Desktop and mobile, any modern browser. Nothing to install." },
  { icon: <ScreenShareIcon />, title: "Screen sharing", text: "Present a tab, a window, or your whole screen with a single toggle." },
  { icon: <ChatIcon />, title: "In-call chat", text: "Messages, links and notes for everyone, kept for the whole call." },
  { icon: <ShieldIcon />, title: "Private by default", text: "Every room has a unique code and media flows straight between people." },
];

const steps = [
  { n: "01", title: "Sign in", text: "Create a free account with your email in a few seconds. You only need one to start a meeting." },
  { n: "02", title: "New meeting", text: "One tap spins up a room with its own shareable code and link." },
  { n: "03", title: "Share & talk", text: "Send the link, let people in, and you're face to face — right in the browser." },
];

const stats = [
  { to: 120, suffix: "k+", label: "Meetings started" },
  { to: 40, suffix: "+", label: "Countries" },
  { to: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
  { to: 2, suffix: "s", label: "Median join time" },
];

const quotes = [
  {
    text: "We swapped our old tool for CoreMeet in an afternoon. Standups feel faster and nobody fights with settings anymore.",
    name: "Maya Farouk",
    role: "Eng. Manager, Northwind",
  },
  {
    text: "The present mode is exactly right — my slides take over and I can still see the room reacting.",
    name: "Daniel Ortiz",
    role: "Product Designer",
  },
  {
    text: "Clients join from a link with no download. That alone saved us the first five minutes of every call.",
    name: "Sara Nabil",
    role: "Founder, Studio Lumen",
  },
];

const faqs = [
  { q: "Do I need an account to join a meeting?", a: "No. Anyone with the link can join — you just pick a name and set your camera and mic on the way in. An account is only needed to create a meeting." },
  { q: "How many people can be in a call?", a: "CoreMeet uses a peer-to-peer mesh, which is great for small groups — comfortably up to around 8 people. Larger rooms are on the roadmap." },
  { q: "Is it really free?", a: "Yes. Creating and joining meetings is free, with no time limit and no credit card." },
  { q: "Where does my video go?", a: "Straight between participants over WebRTC. The server only helps set up the connection and relays chat and presence." },
  { q: "Which browsers work?", a: "Any modern browser — Chrome, Edge, Firefox, Safari — on desktop or mobile. Nothing to install." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const reduce = useReducedMotion();
  const startHref = status === "authenticated" ? "/app" : "/register";
  const [code, setCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (c) navigate(`/meeting/${encodeURIComponent(c)}`);
  };

  return (
    <div className="landing">
      {/* ---------------- HERO ---------------- */}
      <section className="landing__hero">
        <div className="landing__hero-bg" aria-hidden>
          <span className="blob blob--1" />
          <span className="blob blob--2" />
          <span className="grid-fade" />
        </div>

        <div className="container landing__hero-inner">
          <motion.div
            className="landing__hero-copy"
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow"><SparkleIcon width={14} height={14} /> WebRTC video, reimagined</span>
            <h1>
              Meetings that start{" "}
              <span className="landing__hl">the moment you do.</span>
            </h1>
            <p className="landing__lead">
              CoreMeet is a clean, fast place to meet. Create a room, share the code,
              and everyone is talking face to face — no downloads, no friction.
            </p>

            <div className="landing__actions">
              <button className="btn btn--primary btn--lg" onClick={() => navigate(startHref)}>
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
              <CheckIcon width={15} height={15} /> Free forever
              <CheckIcon width={15} height={15} /> No credit card
              <CheckIcon width={15} height={15} /> Join without an account
            </p>
          </motion.div>

          <motion.div
            className="landing__hero-art"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="landing__hero-frame">
              <BrandImage name="hero_team" alt="A team on a CoreMeet video call" loading="eager" className="landing__hero-photo" />
              <motion.div
                className="landing__hero-chip landing__hero-chip--a"
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="dot" /> 6 people live
              </motion.div>
              <motion.div
                className="landing__hero-chip landing__hero-chip--b"
                animate={reduce ? undefined : { y: [0, 10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <ScreenShareIcon width={16} height={16} /> Presenting
              </motion.div>
            </div>
          </motion.div>
        </div>

        <Reveal from="up" delay={0.1}>
          <div className="container landing__logos">
            <span>Teams keep their conversations moving with CoreMeet</span>
            <div className="landing__logos-row">
              {["Northwind", "Lumen", "Aperture", "Halcyon", "Foundry", "Bright"].map((n) => (
                <span key={n} className="landing__logo">{n}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- HIGHLIGHTS ---------------- */}
      <section id="features" className="landing__highlights container">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">Built for real conversations</span>
            <h2>Everything a call needs. Nothing it doesn't.</h2>
          </header>
        </Reveal>

        {highlights.map((h, i) => (
          <Reveal key={h.title} from={i % 2 ? "left" : "right"}>
            <article className={`landing__row ${i % 2 ? "landing__row--rev" : ""}`}>
              <div className="landing__row-copy">
                <span className="landing__row-tag">{h.icon} {h.tag}</span>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
                <ul>
                  {h.points.map((p) => (
                    <li key={p}><CheckIcon width={16} height={16} /> {p}</li>
                  ))}
                </ul>
              </div>
              <div className="landing__row-art">
                <BrandImage name={h.image} alt={h.title} className="landing__row-photo" />
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      {/* ---------------- FEATURE GRID ---------------- */}
      <section className="landing__section container">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">Everything you need</span>
            <h2>A focused set of tools, done well.</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__grid">
          {features.map((f) => (
            <RevealItem key={f.title} as="article" className="landing__feature card">
              <span className="landing__feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- SHOWCASE ---------------- */}
      <section className="landing__showcase">
        <div className="container">
          <Reveal>
            <header className="landing__section-head landing__section-head--light">
              <span className="eyebrow eyebrow--onDark"><PlayIcon width={13} height={13} /> See it in motion</span>
              <h2>The whole meeting, on one clean screen.</h2>
              <p>Video, chat, people and presenting — laid out so you always know where to look.</p>
            </header>
          </Reveal>
          <Reveal from="up" delay={0.1}>
            <div className="landing__showcase-frame">
              <BrandImage name="tiles_3d" alt="CoreMeet meeting layout" className="landing__showcase-img" />
              <div className="landing__showcase-bar" aria-hidden>
                <span /><span /><span className="is-red" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how" className="landing__section container">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps to your first call.</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__steps" as="ol">
          {steps.map((s) => (
            <RevealItem key={s.n} as="li" className="landing__step card">
              <span className="landing__step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="landing__stats">
        <div className="container landing__stats-row">
          {stats.map((s) => (
            <Reveal key={s.label} from="up">
              <div className="landing__stat">
                <strong><CountUp to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} /></strong>
                <span>{s.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="landing__section container">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">Loved by teams</span>
            <h2>People stopped thinking about the tool.</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__quotes">
          {quotes.map((q) => (
            <RevealItem key={q.name} as="article" className="landing__quote card">
              <WaveIcon className="landing__quote-mark" width={26} height={26} />
              <p>“{q.text}”</p>
              <footer>
                <span className="landing__quote-avatar">{q.name.split(" ").map((w) => w[0]).join("")}</span>
                <span>
                  <strong>{q.name}</strong>
                  <small>{q.role}</small>
                </span>
              </footer>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section id="security" className="landing__security container">
        <Reveal from="right">
          <div className="landing__security-art">
            <BrandImage name="security_shield" alt="CoreMeet keeps meetings private" className="landing__security-img" />
          </div>
        </Reveal>
        <Reveal from="left">
          <div className="landing__security-copy">
            <span className="eyebrow">Private by design</span>
            <h2>Your meeting is safe.</h2>
            <p>No one joins a room unless the host lets them in, and your audio and video travel directly between participants.</p>
            <ul>
              <li><LockIcon width={18} height={18} /> Peer-to-peer media — the server never sees your call</li>
              <li><ShieldIcon width={18} height={18} /> Unique room codes, host admits guests</li>
              <li><GlobeIcon width={18} height={18} /> Rotating refresh tokens, hashed at rest</li>
              <li><ClockIcon width={18} height={18} /> Rooms end when the host ends them</li>
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="landing__section container landing__faq">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">Good to know</span>
            <h2>Questions, answered.</h2>
          </header>
        </Reveal>
        <div className="landing__faq-list">
          {faqs.map((f, i) => (
            <Reveal key={f.q} from="up">
              <div className={`landing__faq-item ${openFaq === i ? "is-open" : ""}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  {openFaq === i ? <MinusIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                </button>
                <motion.div
                  className="landing__faq-a"
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p>{f.a}</p>
                </motion.div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="landing__cta">
        <div className="landing__cta-bg" aria-hidden>
          <BrandImage name="texture_mesh" alt="" className="landing__cta-img" />
        </div>
        <Reveal>
          <div className="container landing__cta-inner">
            <h2>Start your next meeting in five seconds.</h2>
            <p>Free forever. No credit card. Your team can join from a link.</p>
            <div className="landing__cta-actions">
              <button className="btn btn--lg landing__cta-btn" onClick={() => navigate(startHref)}>
                Get started free <ArrowRightIcon width={18} height={18} />
              </button>
              <button className="btn btn--lg landing__cta-ghost" onClick={() => navigate("/register")}>
                Create an account
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
