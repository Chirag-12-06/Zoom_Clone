"use client";

import { MicOff, UserX } from "lucide-react";
import { useEffect, useRef } from "react";

import Avatar from "@/components/ui/Avatar";
import type { Participant } from "@/lib/types";

type VideoTileProps = {
  participant: Participant;
  stream?: MediaStream | null; // only the local user has a real stream (no WebRTC)
  isSelf?: boolean;
  // Only passed when the viewer is the host and this tile is someone else
  hostActions?: { onMute: () => void; onRemove: () => void };
};

export default function VideoTile({ participant, stream, isSelf = false, hostActions }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(stream) && participant.video;

  useEffect(() => {
    // A MediaStream can't be passed as a JSX attribute; it has to be set on the DOM element
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
  }, [stream, showVideo]);

  return (
    <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zoom-tile">
      {showVideo ? (
        // muted: never play your own mic back to yourself. -scale-x-100 mirrors it like a real mirror.
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
      ) : (
        <Avatar
          name={participant.display_name}
          className="h-12 w-12 text-lg sm:h-20 sm:w-20 sm:text-3xl lg:h-24 lg:w-24"
        />
      )}

      {hostActions && (
        // Touch screens can't hover, so the buttons are always shown there. On desktop they
        // fade in on hover (or keyboard focus) and ignore clicks while hidden.
        <div className="absolute right-2 top-2 flex gap-1 md:pointer-events-none md:opacity-0 md:transition-opacity md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          {participant.audio && (
            <TileButton label={`Mute ${participant.display_name}`} onClick={hostActions.onMute}>
              <MicOff className="h-3.5 w-3.5" />
              Mute
            </TileButton>
          )}
          <TileButton label={`Remove ${participant.display_name}`} onClick={hostActions.onRemove} danger>
            <UserX className="h-3.5 w-3.5" />
            Remove
          </TileButton>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[90%] items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {!participant.audio && <MicOff className="h-3.5 w-3.5 shrink-0 text-red-500" />}
        <span className="truncate">
          {participant.display_name}
          {isSelf && " (You)"}
        </span>
      </div>
    </div>
  );
}

type TileButtonProps = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
};

function TileButton({ label, onClick, danger = false, children }: TileButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white ${
        danger ? "hover:bg-red-600" : "hover:bg-black/90"
      }`}
    >
      {children}
    </button>
  );
}
