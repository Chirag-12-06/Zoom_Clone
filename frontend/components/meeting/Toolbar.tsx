"use client";

import { MessageSquare, Mic, MicOff, Shield, SquareArrowUp, Users, Video, VideoOff, X } from "lucide-react";
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
  onMuteAll: () => void;
};

/** Zoom's bottom bar: Audio / Video on the left, features in the centre, End on the right */
export default function Toolbar(props: ToolbarProps) {
  const { audioOn, videoOn, mediaAvailable, participantCount, participantsOpen, isHost } = props;
  const [openMenu, setOpenMenu] = useState<"host" | "end" | null>(null);
  const toggleMenu = (menu: "host" | "end") => setOpenMenu((open) => (open === menu ? null : menu));

  return (
    // Three columns so the centre cluster stays exactly centred whatever is on either side
    <footer className="grid h-18 shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-black px-1 sm:px-3">
      <div className="flex">
        {/* Zoom keeps the labels fixed ("Audio", "Video"); the accessible name says what a click does */}
        <ToolbarButton
          label="Audio"
          ariaLabel={audioOn ? "Mute" : "Unmute"}
          onClick={props.onToggleAudio}
          disabled={!mediaAvailable}
        >
          {audioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6 text-red-500" />}
        </ToolbarButton>
        <ToolbarButton
          label="Video"
          ariaLabel={videoOn ? "Stop Video" : "Start Video"}
          onClick={props.onToggleVideo}
          disabled={!mediaAvailable}
        >
          {videoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6 text-red-500" />}
        </ToolbarButton>
      </div>

      <div className="flex">
        <ToolbarButton label="Participants" onClick={props.onToggleParticipants} active={participantsOpen}>
          <span className="relative">
            <Users className="h-6 w-6" />
            <span className="absolute -right-3.5 -top-1.5 text-xs font-medium">{participantCount}</span>
          </span>
        </ToolbarButton>
        {/* Placeholders to match Zoom's layout; not part of this project's scope */}
        <ToolbarButton label="Chat" disabled className="hidden sm:flex">
          <MessageSquare className="h-6 w-6" />
        </ToolbarButton>
        <ToolbarButton label="Share" disabled className="hidden sm:flex">
          <SquareArrowUp className="h-6 w-6" />
        </ToolbarButton>
        {isHost && (
          <div className="relative">
            <ToolbarButton label="Host tools" onClick={() => toggleMenu("host")} active={openMenu === "host"}>
              <Shield className="h-6 w-6" />
            </ToolbarButton>
            {openMenu === "host" && (
              <Menu className="left-1/2 -translate-x-1/2">
                <MenuButton
                  onClick={() => {
                    props.onMuteAll();
                    setOpenMenu(null);
                  }}
                >
                  <MicOff className="h-4 w-4" /> Mute All
                </MenuButton>
              </Menu>
            )}
          </div>
        )}
      </div>

      <div className="relative flex justify-end">
        <ToolbarButton
          label={isHost ? "End" : "Leave"}
          // Guests leave straight away; the host first chooses between ending for all and leaving
          onClick={isHost ? () => toggleMenu("end") : props.onLeave}
          active={openMenu === "end"}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600">
            <X className="h-4 w-4" strokeWidth={3} />
          </span>
        </ToolbarButton>
        {openMenu === "end" && (
          <Menu className="right-0">
            <MenuButton onClick={props.onEndMeeting} danger>
              End Meeting for All
            </MenuButton>
            <MenuButton onClick={props.onLeave}>Leave Meeting</MenuButton>
          </Menu>
        )}
      </div>
    </footer>
  );
}

type ToolbarButtonProps = {
  label: string;
  ariaLabel?: string; // when the visible label doesn't say what a click does
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
};

function ToolbarButton(props: ToolbarButtonProps) {
  const { label, ariaLabel = label, onClick, disabled, active, className = "flex", children } = props;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${className} min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-100 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent sm:min-w-18 ${
        active ? "bg-white/10" : ""
      }`}
    >
      {children}
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}

function Menu({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute bottom-16 z-30 flex w-52 flex-col gap-1 rounded-xl border border-zoom-border bg-zoom-surface p-2 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

type MenuButtonProps = { onClick: () => void; danger?: boolean; children: React.ReactNode };

function MenuButton({ onClick, danger = false, children }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${
        danger ? "bg-red-600 hover:bg-red-700" : "bg-zoom-surface-2 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}
