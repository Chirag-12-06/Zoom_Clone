"use client";

import { MessageSquare, Mic, MicOff, MonitorUp, Users, Video, VideoOff } from "lucide-react";
import { useState } from "react";

type ToolbarProps = {
  audioOn: boolean;
  videoOn: boolean;
  mediaAvailable: boolean;
  participantCount: number;
  participantsOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  isHost: boolean;
  onEndMeeting: () => void;
};

/** Zoom's bottom bar: mic and camera on the left, features in the middle, Leave on the right */
export default function Toolbar(props: ToolbarProps) {
  const { audioOn, videoOn, mediaAvailable, participantCount, participantsOpen } = props;
  const [endMenuOpen, setEndMenuOpen] = useState(false);

  return (
    <footer className="flex h-16 shrink-0 items-center justify-between gap-2 bg-toolbar-bg px-2 text-white sm:px-4">
      <div className="flex">
        <ToolbarButton
          label={audioOn ? "Mute" : "Unmute"}
          onClick={props.onToggleAudio}
          disabled={!mediaAvailable}
        >
          {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-red-500" />}
        </ToolbarButton>
        <ToolbarButton
          label={videoOn ? "Stop Video" : "Start Video"}
          onClick={props.onToggleVideo}
          disabled={!mediaAvailable}
        >
          {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-red-500" />}
        </ToolbarButton>
      </div>

      <div className="flex">
        <ToolbarButton label="Participants" onClick={props.onToggleParticipants} active={participantsOpen}>
          <span className="relative">
            <Users className="h-5 w-5" />
            <span className="absolute -right-3 -top-2 rounded-full bg-[#3a3a3a] px-1 text-[10px]">
              {participantCount}
            </span>
          </span>
        </ToolbarButton>
        {/* Placeholders to match Zoom's layout; not part of this project's scope */}
        <ToolbarButton label="Chat" disabled className="hidden sm:flex">
          <MessageSquare className="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton label="Share Screen" disabled className="hidden sm:flex">
          <MonitorUp className="h-5 w-5 text-green-500" />
        </ToolbarButton>
      </div>

      {props.isHost ? (
        // Like Zoom: the host chooses between ending for everyone and just leaving
        <div className="relative">
          <button
            onClick={() => setEndMenuOpen((open) => !open)}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-700"
          >
            End
          </button>
          {endMenuOpen && (
            <div className="absolute bottom-12 right-0 z-30 flex w-52 flex-col gap-2 rounded-lg bg-[#2b2b2b] p-3 shadow-xl">
              <button
                onClick={props.onEndMeeting}
                className="rounded-lg bg-red-600 py-2 text-sm font-semibold hover:bg-red-700"
              >
                End Meeting for All
              </button>
              <button
                onClick={props.onLeave}
                className="rounded-lg bg-[#3a3a3a] py-2 text-sm font-semibold hover:bg-[#4a4a4a]"
              >
                Leave Meeting
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={props.onLeave}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-700"
        >
          Leave
        </button>
      )}
    </footer>
  );
}

type ToolbarButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  disabled,
  active,
  className = "flex",
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${className} min-w-16 flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-200 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent ${
        active ? "bg-white/10" : ""
      }`}
    >
      {children}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
