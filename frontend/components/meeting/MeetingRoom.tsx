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
import { ApiError, getMe, getMeeting } from "@/lib/api";
import type { MeetingPublic, Participant } from "@/lib/types";

// Until the live roster arrives over WebSocket, the only participant is the local user
const SELF_ID = 0;

type MeetingRoomProps = {
  code: string;
  passcode: string;
  isHost: boolean;
  displayName: string;
};

export default function MeetingRoom({ code, passcode, isHost, displayName }: MeetingRoomProps) {
  const router = useRouter();
  const media = useLocalMedia();
  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(displayName);
  const [joined, setJoined] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

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
    // The host arrives from the dashboard without a name in the URL: use their account name
    if (isHost && !displayName) getMe().then((user) => setName(user.name));
  }, [isHost, displayName]);

  function leave() {
    media.stop();
    router.push("/");
  }

  if (error || meeting?.has_ended) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-meeting-bg p-4 text-white">
        <p className="text-lg">{error ?? "This meeting has ended."}</p>
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

  const participants: Participant[] = [
    { id: SELF_ID, display_name: name.trim(), is_host: isHost, audio: media.audioOn, video: media.videoOn },
  ];

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

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <VideoGrid participants={participants} selfId={SELF_ID} selfStream={media.stream} />
        </div>
        {participantsOpen && (
          <ParticipantsPanel
            participants={participants}
            selfId={SELF_ID}
            onClose={() => setParticipantsOpen(false)}
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
      />
    </div>
  );
}
