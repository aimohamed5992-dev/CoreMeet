import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

type Dir = "up" | "down" | "left" | "right" | "none";
const D = 26;

function offsetFor(from: Dir, reduce: boolean | null) {
  if (reduce) return {};
  return {
    up: { y: D },
    down: { y: -D },
    left: { x: D },
    right: { x: -D },
    none: {},
  }[from];
}

const ease = [0.22, 1, 0.36, 1] as const;

/** Single element that fades/slides in when scrolled into view. */
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  from?: Dir;
  delay?: number;
  className?: string;
  style?: ComponentProps<typeof motion.div>["style"];
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, ...offsetFor(from, reduce) },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.55, delay, ease } },
  };
  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** Wrap a list; each <RevealItem> child animates in sequence. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  from = "up",
  className,
  as = "div",
}: {
  children: ReactNode;
  from?: Dir;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, ...offsetFor(from, reduce) },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease } },
      }}
    >
      {children}
    </Tag>
  );
}
