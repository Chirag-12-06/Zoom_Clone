import { MessageSquare, Mic, MicOff, MonitorUp, Users, Video, VideoOff } from "lucide-react";

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
};

/** Zoom's bottom bar: mic and camera on the left, features in the middle, Leave on the right */
export default function Toolbar(props: ToolbarProps) {
  const { audioOn, videoOn, mediaAvailable, participantCount, participantsOpen } = props;

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

      <button
        onClick={props.onLeave}
        className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-700"
      >
        Leave
      </button>
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
