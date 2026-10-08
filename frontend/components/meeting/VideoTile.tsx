"use client";

import { MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

import Avatar from "@/components/ui/Avatar";
import type { Participant } from "@/lib/types";

type VideoTileProps = {
  participant: Participant;
  stream?: MediaStream | null; // only the local user has a real stream (no WebRTC)
  isSelf?: boolean;
};

export default function VideoTile({ participant, stream, isSelf = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(stream) && participant.video;

  useEffect(() => {
    // A MediaStream can't be passed as a JSX attribute; it has to be set on the DOM element
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
  }, [stream, showVideo]);

  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#2b2b2b]">
      {showVideo ? (
        // muted: never play your own mic back to yourself. -scale-x-100 mirrors it like a real mirror.
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
      ) : (
        <Avatar name={participant.display_name} className="h-20 w-20 text-3xl sm:h-24 sm:w-24" />
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
