import VideoTile from "@/components/meeting/VideoTile";
import type { Participant } from "@/lib/types";

/** Gallery view: pick the number of columns from how many people there are */
function gridColumns(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-4xl";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-5xl";
  if (count <= 4) return "grid-cols-2 max-w-5xl"; // 2x2, also on phones
  if (count <= 9) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
}

type VideoGridProps = {
  participants: Participant[];
  selfId: number;
  selfStream: MediaStream | null;
  isHost: boolean; // the host gets Mute / Remove on everyone else's tile
  onMute: (participant: Participant) => void;
  onRemove: (participant: Participant) => void;
};

export default function VideoGrid(props: VideoGridProps) {
  const { participants, selfId, selfStream, isHost } = props;
  return (
    // Centred with my-auto/mx-auto rather than items-center: when the tiles are taller than
    // the screen, items-center would push the first row above the top where it can't be scrolled to
    <div className="flex h-full overflow-y-auto p-2 sm:p-4">
      <div className={`m-auto grid w-full gap-2 ${gridColumns(participants.length)}`}>
        {participants.map((participant) => {
          const isSelf = participant.id === selfId;
          return (
            <VideoTile
              key={participant.id}
              participant={participant}
              stream={isSelf ? selfStream : null}
              isSelf={isSelf}
              hostActions={
                isHost && !isSelf
                  ? { onMute: () => props.onMute(participant), onRemove: () => props.onRemove(participant) }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
