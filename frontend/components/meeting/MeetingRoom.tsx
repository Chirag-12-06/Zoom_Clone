"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import MeetingInfo from "@/components/meeting/MeetingInfo";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import PreJoin from "@/components/meeting/PreJoin";
import Toolbar from "@/components/meeting/Toolbar";
import VideoGrid from "@/components/meeting/VideoGrid";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { useMeetingSocket } from "@/hooks/useMeetingSocket";
import { ApiError, getMe, getMeeting } from "@/lib/api";
import { isRememberedHost, rememberHost } from "@/lib/meeting-link";
import type { MeetingPublic, Participant } from "@/lib/types";

type MeetingRoomProps = {
  code: string;
  passcode: string;
  hostInUrl: boolean; // ?host=1, set by the dashboard's New meeting / Start buttons
  displayName: string;
};

export default function MeetingRoom({ code, passcode, hostInUrl, displayName }: MeetingRoomProps) {
  const router = useRouter();
  // Host if the URL says so, or if this tab already came in as host (e.g. after a refresh).
  // Reading sessionStorage here is safe for hydration: the first render is "Loading meeting…"
  // either way, so server and browser HTML match.
  const [isHost] = useState(() => hostInUrl || isRememberedHost(code));
  const media = useLocalMedia();
  const stopMedia = media.stop;
  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(displayName);
  const [joined, setJoined] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const socket = useMeetingSocket({
    // The host must wait for their user id: it's what makes the server treat them as host
    enabled: joined && (!isHost || userId !== null),
    code,
    passcode,
    displayName: name.trim(),
    userId,
    audio: media.audioOn,
    video: media.videoOn,
    // The server already marked us muted for everyone; just turn the real mic off
    onForceMute: () => {
      media.setAudio(false);
      setNotice("The host muted everyone");
    },
  });

  useEffect(() => {
    // Removed, or the host ended the meeting: release the camera and mic
    if (socket.endedReason) stopMedia();
  }, [socket.endedReason, stopMedia]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    // Remember host status in this tab, then take host=1 out of the address bar so that
    // copying the URL can't make someone else the host
    if (!hostInUrl || !rememberHost(code)) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("host");
    window.history.replaceState(null, "", url);
  }, [hostInUrl, code]);

  useEffect(() => {
    getMeeting(code)
      .then(setMeeting)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404 ? "Meeting not found" : "Something went wrong",
        ),
      );
  }, [code]);

  useEffect(() => {
    if (!isHost) return;
    getMe().then((user) => {
      setUserId(user.id);
      // The host arrives from the dashboard without a name in the URL: use their account name
      if (!displayName) setName(user.name);
    });
  }, [isHost, displayName]);

  function leave() {
    media.stop();
    router.push("/"); // unmounting closes the socket, so everyone else sees us leave
  }

  function endForAll() {
    socket.endMeeting(); // queued before leave() closes the socket, so it's still delivered
    leave();
  }

  const fatalError =
    error ??
    socket.error ??
    (socket.endedReason === "removed" ? "You have been removed from this meeting by the host." : null) ??
    (socket.endedReason === "ended" ? "This meeting has been ended by the host." : null) ??
    (socket.endedReason === "replaced" ? "You joined this meeting from another window." : null) ??
    (meeting?.has_ended ? "This meeting has ended." : null);
  if (fatalError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-meeting-bg p-4 text-white">
        <p className="text-lg">{fatalError}</p>
        <Link
          href="/"
          className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-medium hover:bg-zoom-blue-dark"
        >
          Back to home
        </Link>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-meeting-bg text-gray-400">
        Loading meeting…
      </main>
    );
  }

  if (!joined) {
    return (
      <PreJoin
        meeting={meeting}
        stream={media.stream}
        mediaError={media.error}
        audioOn={media.audioOn}
        videoOn={media.videoOn}
        onToggleAudio={media.toggleAudio}
        onToggleVideo={media.toggleVideo}
        name={name}
        onNameChange={setName}
        onJoin={() => setJoined(true)}
      />
    );
  }

  // Until the server's welcome arrives, show just the local user.
  // After that, use the live roster, but always take our own mic/camera state from the
  // local hook so our tile updates instantly instead of waiting for the server echo.
  const selfId = socket.selfId ?? -1;
  const participants: Participant[] =
    socket.selfId === null
      ? [
          {
            id: selfId,
            display_name: name.trim(),
            is_host: isHost,
            audio: media.audioOn,
            video: media.videoOn,
          },
        ]
      : socket.participants.map((p) =>
          p.id === selfId ? { ...p, audio: media.audioOn, video: media.videoOn } : p,
        );

  return (
    <div className="flex h-dvh flex-col bg-meeting-bg text-white">
      <header className="relative flex h-10 shrink-0 items-center gap-2 px-4 text-sm">
        <button
          onClick={() => setInfoOpen((open) => !open)}
          aria-label="Meeting information"
          className="rounded p-1 text-green-500 hover:bg-white/10"
        >
          <Info className="h-4 w-4" />
        </button>
        <span className="truncate text-gray-300">{meeting.title}</span>
        {infoOpen && (
          <div className="absolute left-4 top-10 z-30">
            <MeetingInfo meeting={meeting} passcode={passcode} />
          </div>
        )}
      </header>

      {socket.disconnected && (
        <p className="bg-red-600 px-4 py-1.5 text-center text-sm">
          Connection lost.{" "}
          <button onClick={() => window.location.reload()} className="font-semibold underline">
            Rejoin
          </button>
        </p>
      )}
      {notice && <p className="bg-[#2b2b2b] px-4 py-1.5 text-center text-sm">{notice}</p>}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <VideoGrid participants={participants} selfId={selfId} selfStream={media.stream} />
        </div>
        {participantsOpen && (
          <ParticipantsPanel
            participants={participants}
            selfId={selfId}
            isHost={socket.isHost}
            onClose={() => setParticipantsOpen(false)}
            onMuteAll={socket.muteAll}
            onMute={(participant) => socket.muteParticipant(participant.id)}
            onRemove={(participant) => {
              if (window.confirm(`Remove ${participant.display_name} from the meeting?`)) {
                socket.removeParticipant(participant.id);
              }
            }}
          />
        )}
      </div>

      <Toolbar
        audioOn={media.audioOn}
        videoOn={media.videoOn}
        mediaAvailable={media.stream !== null}
        participantCount={participants.length}
        participantsOpen={participantsOpen}
        onToggleAudio={media.toggleAudio}
        onToggleVideo={media.toggleVideo}
        onToggleParticipants={() => setParticipantsOpen((open) => !open)}
        onLeave={leave}
        isHost={socket.isHost}
        onEndMeeting={endForAll}
      />
    </div>
  );
}
