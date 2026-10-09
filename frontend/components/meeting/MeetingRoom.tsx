"use client";

import { ShieldCheck } from "lucide-react";
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
import { getToken } from "@/lib/auth";
import type { MeetingPublic, Participant } from "@/lib/types";

type MeetingRoomProps = {
  code: string;
  passcode: string;
  displayName: string;
};

export default function MeetingRoom({ code, passcode, displayName }: MeetingRoomProps) {
  const router = useRouter();
  // Logged-in users send their token when joining; the server decides who is the host.
  // Reading localStorage here is safe for hydration: the first render is "Loading meeting…"
  // either way, so server and browser HTML match.
  const [token] = useState(getToken);
  const media = useLocalMedia();
  const stopMedia = media.stop;
  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(displayName);
  const [joined, setJoined] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const socket = useMeetingSocket({
    enabled: joined,
    code,
    passcode,
    displayName: name.trim(),
    token,
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
    getMeeting(code)
      .then(setMeeting)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404 ? "Meeting not found" : "Something went wrong",
        ),
      );
  }, [code]);

  useEffect(() => {
    // Logged in and no name from the join form: start with the account name (still editable).
    // If the token has expired this just fails quietly and the person joins as a guest.
    if (!token || displayName) return;
    getMe()
      .then((user) => setName(user.name))
      .catch(() => {});
  }, [token, displayName]);

  function leave() {
    media.stop();
    router.push("/"); // unmounting closes the socket, so everyone else sees us leave
  }

  function endForAll() {
    socket.endMeeting(); // queued before leave() closes the socket, so it's still delivered
    leave();
  }

  // Host actions, shared by the participants panel and the video tiles
  function muteParticipant(participant: Participant) {
    socket.muteParticipant(participant.id);
  }

  function removeParticipant(participant: Participant) {
    if (window.confirm(`Remove ${participant.display_name} from the meeting?`)) {
      socket.removeParticipant(participant.id);
    }
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
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zoom-bg p-4 text-white">
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
      <main className="flex min-h-dvh items-center justify-center bg-zoom-bg text-zoom-muted">
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
            is_host: socket.isHost,
            audio: media.audioOn,
            video: media.videoOn,
          },
        ]
      : socket.participants.map((p) =>
          p.id === selfId ? { ...p, audio: media.audioOn, video: media.videoOn } : p,
        );

  return (
    <div className="flex h-dvh flex-col bg-zoom-bg text-white">
      {socket.disconnected && (
        <p className="bg-red-600 px-4 py-1.5 text-center text-sm">
          Connection lost.{" "}
          <button onClick={() => window.location.reload()} className="font-semibold underline">
            Rejoin
          </button>
        </p>
      )}
      {notice && <p className="bg-zoom-surface-2 px-4 py-1.5 text-center text-sm">{notice}</p>}

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {/* Zoom's floating top-right pill: the green shield opens the meeting information */}
          <div className="absolute right-3 top-3 z-20 rounded-xl bg-black/70 p-1">
            <button
              onClick={() => setInfoOpen((open) => !open)}
              aria-label="Meeting information"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/10"
            >
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="hidden max-w-56 truncate text-gray-200 sm:block">{meeting.title}</span>
            </button>
          </div>
          {infoOpen && (
            <div className="absolute right-3 top-16 z-30 w-[calc(100%-1.5rem)] max-w-md">
              <MeetingInfo meeting={meeting} passcode={passcode} />
            </div>
          )}
          {/* Top padding keeps the pill from covering the top-right tile's host buttons */}
          <div className="h-full pt-12">
            <VideoGrid
              participants={participants}
              selfId={selfId}
              selfStream={media.stream}
              isHost={socket.isHost}
              onMute={muteParticipant}
              onRemove={removeParticipant}
            />
          </div>
        </div>
        {participantsOpen && (
          <ParticipantsPanel
            participants={participants}
            selfId={selfId}
            isHost={socket.isHost}
            onClose={() => setParticipantsOpen(false)}
            onMuteAll={socket.muteAll}
            onMute={muteParticipant}
            onRemove={removeParticipant}
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
        onMuteAll={socket.muteAll}
      />
    </div>
  );
}
