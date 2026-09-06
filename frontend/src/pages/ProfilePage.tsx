import { useRef, useState } from "react";
import { useAuth } from "../lib/auth/AuthContext";
import { fileToAvatarDataUrl } from "../lib/image";
import { errorMessage } from "../lib/api";
import Avatar from "../components/Avatar";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const dirty = name.trim() !== user.name || avatarUrl !== (user.avatarUrl ?? null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setAvatarUrl(await fileToAvatarDataUrl(file));
      setSaved(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), avatarUrl });
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e, "Could not save your profile."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 460 }}>
      <h1 style={{ fontSize: "1.6rem" }}>Your profile</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 6 }}>
        Your name and photo appear on your video tile and in the people list.
      </p>

      <div className="card" style={{ padding: 24, marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar user={{ name: name || "?", avatarColor: user.avatarColor, avatarUrl }} size={72} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              {avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {avatarUrl && (
              <button className="btn btn--ghost" onClick={() => { setAvatarUrl(null); setSaved(false); }}>
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <label className="field">
          <span>Name</span>
          <input
            className="input"
            value={name}
            maxLength={120}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input className="input" value={user.email} disabled />
        </label>

        {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>}
        {saved && !dirty && <p style={{ color: "var(--primary)", fontSize: "0.9rem" }}>Saved ✓</p>}

        <button
          className="btn btn--primary"
          onClick={save}
          disabled={busy || !dirty || name.trim().length < 2}
          style={{ alignSelf: "flex-start" }}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
