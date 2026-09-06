function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarUser = { name: string; avatarColor: string; avatarUrl?: string | null };

export default function Avatar({ user, size = 34 }: { user: AvatarUser; size?: number }) {
  const common = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: "none" as const,
    display: "inline-block" as const,
    objectFit: "cover" as const,
  };

  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="" aria-hidden style={common} />;
  }

  return (
    <span
      aria-hidden
      style={{
        ...common,
        background: user.avatarColor,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        fontFamily: "var(--font-sans)",
      }}
    >
      {initials(user.name)}
    </span>
  );
}
