import { useState } from "react";

/**
 * Marketing photo served from /public/manus. Falls back to a soft brand gradient
 * if the asset isn't present yet, so the layout never breaks.
 */
export default function BrandImage({
  name,
  alt,
  className,
  style,
  loading = "lazy",
}: {
  name: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        aria-label={alt}
        role="img"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-200), var(--brand-50) 55%, #fff)",
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={`/manus/${name}.jpg`}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
