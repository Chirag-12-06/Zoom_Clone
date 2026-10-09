"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import Link from "next/link";

import VideoTile from "@/components/meeting/VideoTile";
import type { MeetingPublic } from "@/lib/types";

type PreJoinProps = {
  meeting: MeetingPublic;
  stream: MediaStream | null;
  mediaError: string | null;
  audioOn: boolean;
  videoOn: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  name: string;
  onNameChange: (name: string) => void;
  onJoin: () => void;
};

/** Preview screen before entering: check your camera, mic and name */
export default function PreJoin(props: PreJoinProps) {
  const { meeting, stream, mediaError, audioOn, videoOn, name } = props;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zoom-bg p-4 text-white lg:flex-row lg:gap-12">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <VideoTile
          participant={{ id: 0, display_name: name || "You", is_host: false, audio: audioOn, video: videoOn }}
          stream={stream}
        />
        <div className="flex justify-center gap-3">
          <RoundToggle
            on={audioOn}
            onClick={props.onToggleAudio}
            disabled={!stream}
            label={audioOn ? "Mute" : "Unmute"}
          >
            {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </RoundToggle>
          <RoundToggle
            on={videoOn}
            onClick={props.onToggleVideo}
            disabled={!stream}
            label={videoOn ? "Stop video" : "Start video"}
          >
            {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </RoundToggle>
        </div>
        {mediaError && <p className="text-center text-sm text-amber-400">{mediaError}</p>}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.onJoin();
        }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">{meeting.title}</h1>
          <p className="text-sm text-gray-400">Hosted by {meeting.host_name}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm text-gray-300">
          Your name
          <input
            value={name}
            onChange={(e) => props.onNameChange(e.target.value)}
            maxLength={50}
            className="rounded-lg border border-zoom-border bg-zoom-surface-2 px-3 py-2 text-white outline-none focus:border-zoom-blue"
          />
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-zoom-blue py-2.5 font-semibold hover:bg-zoom-blue-dark disabled:bg-zoom-surface-2 disabled:text-zoom-muted"
        >
          Join
        </button>
        <Link href="/" className="text-center text-sm text-gray-400 hover:text-white">
          Cancel
        </Link>
      </form>
    </main>
  );
}

type RoundToggleProps = {
  on: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function RoundToggle({ on, disabled, label, onClick, children }: RoundToggleProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-40 ${
        on ? "bg-zoom-surface-2 hover:bg-white/15" : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {children}
    </button>
  );
}
