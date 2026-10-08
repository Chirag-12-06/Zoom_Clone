import VideoTile from "@/components/meeting/VideoTile";
import type { Participant } from "@/lib/types";

/** Gallery view: pick the number of columns from how many people there are */
function gridColumns(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-4xl";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  if (count <= 9) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
}

type VideoGridProps = {
  participants: Participant[];
  selfId: number;
  selfStream: MediaStream | null;
};

export default function VideoGrid({ participants, selfId, selfStream }: VideoGridProps) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-2 sm:p-4">
      <div className={`grid w-full gap-2 ${gridColumns(participants.length)}`}>
        {participants.map((participant) => {
          const isSelf = participant.id === selfId;
          return (
            <VideoTile
              key={participant.id}
              participant={participant}
              stream={isSelf ? selfStream : null}
              isSelf={isSelf}
            />
          );
        })}
      </div>
    </div>
  );
}
