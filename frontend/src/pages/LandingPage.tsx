import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const highlightIcons = [<UsersIcon />, <ScreenShareIcon />, <ChatIcon />];
const highlightImages = ["screenshare", "phone_join", "celebrate"];
const featureIcons = [
  <BoltIcon />, <KeyboardIcon />, <DeviceIcon />, <ScreenShareIcon />, <ChatIcon />, <ShieldIcon />,
];
const securityIcons = [<LockIcon width={18} height={18} />, <ShieldIcon width={18} height={18} />,
  <GlobeIcon width={18} height={18} />, <ClockIcon width={18} height={18} />];
const statValues = [
  { to: 120, decimals: 0 },
  { to: 40, decimals: 0 },
  { to: 99.9, decimals: 1 },
  { to: 2, decimals: 0 },
];
const logoNames = ["Northwind", "Lumen", "Aperture", "Halcyon", "Foundry", "Bright"];

type Highlight = { tag: string; title: string; text: string; points: string[] };
type NamedItem = { title: string; text: string };
type Step = { title: string; text: string };
type Stat = { label: string; suffix: string };
type Quote = { text: string; name: string; role: string };
type Faq = { q: string; a: string };

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status } = useAuth();
  const reduce = useReducedMotion();
  const startHref = status === "authenticated" ? "/app" : "/register";
  const [code, setCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const highlights = t("landing.highlights.items", { returnObjects: true }) as Highlight[];
  const features = t("landing.featureGrid.items", { returnObjects: true }) as NamedItem[];
  const steps = t("landing.how.steps", { returnObjects: true }) as Step[];
  const stats = t("landing.stats.items", { returnObjects: true }) as Stat[];
  const quotes = t("landing.testimonials.items", { returnObjects: true }) as Quote[];
  const securityPoints = t("landing.security.points", { returnObjects: true }) as string[];
  const faqs = t("landing.faq.items", { returnObjects: true }) as Faq[];

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
            <span className="eyebrow"><SparkleIcon width={14} height={14} /> {t("landing.hero.eyebrow")}</span>
            <h1>
              {t("landing.hero.titleStart")}{" "}
              <span className="landing__hl">{t("landing.hero.titleAccent")}</span>
            </h1>
            <p className="landing__lead">{t("landing.hero.lead")}</p>

            <div className="landing__actions">
              <button className="btn btn--primary btn--lg" onClick={() => navigate(startHref)}>
                <VideoPlusIcon /> {t("landing.hero.newMeeting")}
              </button>
              <form className="landing__join" onSubmit={join}>
                <KeyboardIcon className="landing__join-icon" />
                <input
                  className="landing__join-input"
                  placeholder={t("landing.hero.codePlaceholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label={t("landing.hero.codeAria")}
                />
                <button type="submit" className="btn btn--ghost" disabled={!code.trim()}>
                  {t("landing.hero.join")} <ArrowRightIcon width={16} height={16} />
                </button>
              </form>
            </div>

            <p className="landing__note">
              <CheckIcon width={15} height={15} /> {t("landing.hero.noteFree")}
              <CheckIcon width={15} height={15} /> {t("landing.hero.noteNoCard")}
              <CheckIcon width={15} height={15} /> {t("landing.hero.noteNoAccount")}
            </p>
          </motion.div>

          <motion.div
            className="landing__hero-art"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.94, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="landing__hero-frame">
              <BrandImage name="hero_team" alt={t("landing.hero.chipLive")} loading="eager" className="landing__hero-photo" />
              <motion.div
                className="landing__hero-chip landing__hero-chip--a"
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="dot" /> {t("landing.hero.chipLive")}
              </motion.div>
              <motion.div
                className="landing__hero-chip landing__hero-chip--b"
                animate={reduce ? undefined : { y: [0, 10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <ScreenShareIcon width={16} height={16} /> {t("landing.hero.chipPresenting")}
              </motion.div>
            </div>
          </motion.div>
        </div>

        <Reveal from="up" delay={0.1}>
          <div className="container landing__logos">
            <span>{t("landing.logos.heading")}</span>
            <div className="landing__logos-row">
              {logoNames.map((n) => (
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
            <span className="eyebrow">{t("landing.highlights.eyebrow")}</span>
            <h2>{t("landing.highlights.title")}</h2>
          </header>
        </Reveal>

        {highlights.map((h, i) => (
          <Reveal key={h.title} from={i % 2 ? "left" : "right"}>
            <article className={`landing__row ${i % 2 ? "landing__row--rev" : ""}`}>
              <div className="landing__row-copy">
                <span className="landing__row-tag">{highlightIcons[i]} {h.tag}</span>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
                <ul>
                  {h.points.map((p) => (
                    <li key={p}><CheckIcon width={16} height={16} /> {p}</li>
                  ))}
                </ul>
              </div>
              <div className="landing__row-art">
                <BrandImage name={highlightImages[i]} alt={h.title} className="landing__row-photo" />
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      {/* ---------------- FEATURE GRID ---------------- */}
      <section className="landing__section container">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">{t("landing.featureGrid.eyebrow")}</span>
            <h2>{t("landing.featureGrid.title")}</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__grid">
          {features.map((f, i) => (
            <RevealItem key={f.title} as="article" className="landing__feature card">
              <span className="landing__feature-icon">{featureIcons[i]}</span>
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
              <span className="eyebrow eyebrow--onDark"><PlayIcon width={13} height={13} /> {t("landing.showcase.eyebrow")}</span>
              <h2>{t("landing.showcase.title")}</h2>
              <p>{t("landing.showcase.text")}</p>
            </header>
          </Reveal>
          <Reveal from="up" delay={0.1}>
            <div className="landing__showcase-frame">
              <BrandImage name="tiles_3d" alt={t("landing.showcase.title")} className="landing__showcase-img" />
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
            <span className="eyebrow">{t("landing.how.eyebrow")}</span>
            <h2>{t("landing.how.title")}</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__steps" as="ol">
          {steps.map((s, i) => (
            <RevealItem key={s.title} as="li" className="landing__step card">
              <span className="landing__step-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="landing__stats">
        <div className="container landing__stats-row">
          {stats.map((s, i) => (
            <Reveal key={s.label} from="up">
              <div className="landing__stat">
                <strong>
                  <CountUp to={statValues[i].to} suffix={s.suffix} decimals={statValues[i].decimals} />
                </strong>
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
            <span className="eyebrow">{t("landing.testimonials.eyebrow")}</span>
            <h2>{t("landing.testimonials.title")}</h2>
          </header>
        </Reveal>
        <RevealGroup className="landing__quotes">
          {quotes.map((q) => (
            <RevealItem key={q.name} as="article" className="landing__quote card">
              <WaveIcon className="landing__quote-mark" width={26} height={26} />
              <p>“{q.text}”</p>
              <footer>
                <span className="landing__quote-avatar">{q.name.trim().charAt(0)}</span>
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
            <BrandImage name="security_shield" alt={t("landing.security.title")} className="landing__security-img" />
          </div>
        </Reveal>
        <Reveal from="left">
          <div className="landing__security-copy">
            <span className="eyebrow">{t("landing.security.eyebrow")}</span>
            <h2>{t("landing.security.title")}</h2>
            <p>{t("landing.security.text")}</p>
            <ul>
              {securityPoints.map((p, i) => (
                <li key={p}>{securityIcons[i]} {p}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="landing__section container landing__faq">
        <Reveal>
          <header className="landing__section-head">
            <span className="eyebrow">{t("landing.faq.eyebrow")}</span>
            <h2>{t("landing.faq.title")}</h2>
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
            <h2>{t("landing.cta.title")}</h2>
            <p>{t("landing.cta.text")}</p>
            <div className="landing__cta-actions">
              <button className="btn btn--lg landing__cta-btn" onClick={() => navigate(startHref)}>
                {t("landing.cta.getStarted")} <ArrowRightIcon width={18} height={18} />
              </button>
              <button className="btn btn--lg landing__cta-ghost" onClick={() => navigate("/register")}>
                {t("landing.cta.createAccount")}
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
