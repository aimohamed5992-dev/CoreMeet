import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeetingMedia } from "../../lib/meetings/useMeetingMedia";
import { meetingsApi } from "../../lib/meetings/meetingsApi";
import { getGuestIdentity, saveGuestIdentity } from "../../lib/meetings/guestIdentity";
import type { MeetingDetail } from "../../lib/meetings/types";
import { useAuth } from "../../lib/auth/AuthContext";
import Lobby from "./Lobby";
import MeetingPage from "./MeetingPage";

/**
 * Wraps the meeting experience: acquires the camera/mic once, shows the lobby
 * (with a name field for guests), and only mounts the live room after "Join".
 * Guests do not need an account.
 */
export default function MeetingRoute() {
  const { code = "" } = useParams();
  const { t } = useTranslation();
  const { user, status } = useAuth();
  const media = useMeetingMedia(true);

  const remembered = useMemo(getGuestIdentity, []);
  const [guestName, setGuestName] = useState(remembered.name);
  const [guestAvatar, setGuestAvatar] = useState<string | null>(remembered.avatarUrl);

  const [joined, setJoined] = useState(false);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = (first: boolean) =>
      meetingsApi
        .getByCode(code)
        .then((m) => active && setMeeting(m))
        .catch(() => active && first && setNotFound(true))
        .finally(() => active && first && setLoadingMeeting(false));

    load(true);
    const id = window.setInterval(() => !joined && load(false), 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [code, joined]);

  const isGuest = status !== "authenticated";

  const join = () => {
    if (isGuest) saveGuestIdentity({ name: guestName.trim(), avatarUrl: guestAvatar, key: remembered.key });
    setJoined(true);
  };

  if (!joined) {
    return (
      <Lobby
        media={media}
        meeting={meeting}
        loadingMeeting={loadingMeeting}
        notFound={notFound}
        isGuest={isGuest}
        displayName={isGuest ? guestName : (user?.name ?? "")}
        avatarUrl={isGuest ? guestAvatar : (user?.avatarUrl ?? null)}
        avatarColor={user?.avatarColor ?? "#1FA84C"}
        onNameChange={setGuestName}
        onAvatarChange={setGuestAvatar}
        onJoin={join}
      />
    );
  }

  return (
    <MeetingPage
      code={code}
      media={media}
      guest={isGuest ? { displayName: guestName.trim() || t("common.guest"), avatarUrl: guestAvatar, key: remembered.key } : undefined}
    />
  );
}
