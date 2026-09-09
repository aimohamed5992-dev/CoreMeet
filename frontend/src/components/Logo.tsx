import type { CSSProperties } from "react";

type LogoProps = {
  /** Height of the mark in px. Wordmark scales with it. */
  size?: number;
  /** Show the "CoreMeet" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Force a single color (e.g. "#fff" on dark surfaces). Defaults to brand green. */
  tone?: "brand" | "mono-light" | "mono-dark";
  style?: CSSProperties;
  className?: string;
};

/**
 * CoreMeet brand mark — a rounded camera body with a lens ring and a
 * triangular viewfinder, echoing the supplied logo.
 */
export function LogoMark({ size = 32, tone = "brand" }: Pick<LogoProps, "size" | "tone">) {
  const fill = tone === "mono-light" ? "#ffffff" : tone === "mono-dark" ? "#0d1b12" : "var(--brand-500)";
  const hole = tone === "brand" ? "#ffffff" : "transparent";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="CoreMeet"
      style={{ flex: "none" }}
    >
      <path
        fill={fill}
        d="M8 14.5C8 11.462 10.462 9 13.5 9h16C32.538 9 35 11.462 35 14.5v3.06l6.7-4.02c1.4-.84 3.3.11 3.3 1.72v17.48c0 1.61-1.9 2.56-3.3 1.72L35 30.44v3.06C35 36.538 32.538 39 29.5 39h-16C10.462 39 8 36.538 8 33.5v-19Z"
      />
      <circle cx="21.5" cy="24" r="7.5" fill={fill} />
      <circle cx="21.5" cy="24" r="7.5" fill="none" stroke={hole} strokeWidth="4.2" />
    </svg>
  );
}

export default function Logo({ size = 30, withWordmark = true, tone = "brand", style, className }: LogoProps) {
  const isMono = tone === "mono-light" || tone === "mono-dark";
  const wordColor = tone === "mono-light" ? "#ffffff" : tone === "mono-dark" ? "#0d1b12" : "var(--text)";
  const accentColor = isMono ? wordColor : "var(--brand-500)";
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}
    >
      <LogoMark size={size} tone={tone} />
      {withWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: size * 0.82,
            letterSpacing: "-0.02em",
            color: wordColor,
            lineHeight: 1,
          }}
        >
          Core<span style={{ color: accentColor }}>Meet</span>
        </span>
      )}
    </span>
  );
}
