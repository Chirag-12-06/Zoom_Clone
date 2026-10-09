import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import type { Participant } from "@/lib/types";

type ParticipantsPanelProps = {
  participants: Participant[];
  selfId: number;
  isHost: boolean; // shows Mute, Remove and Mute All
  onClose: () => void;
  onMuteAll: () => void;
  onMute: (participant: Participant) => void;
  onRemove: (participant: Participant) => void;
};

const hostButton = "rounded-md border border-zoom-border px-2 py-0.5 text-xs";

/** Side panel on desktop, full-screen sheet on phones */
export default function ParticipantsPanel(props: ParticipantsPanelProps) {
  const { participants, selfId, isHost } = props;

  return (
    <aside className="fixed inset-0 z-20 flex flex-col bg-zoom-surface text-white md:static md:w-80 md:shrink-0 md:border-l md:border-zoom-border">
      <header className="flex items-center justify-between border-b border-zoom-border px-4 py-3">
        <h2 className="text-sm font-semibold">Participants ({participants.length})</h2>
        <button
          onClick={props.onClose}
          aria-label="Close participants"
          className="rounded p-1 text-zoom-muted hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="flex-1 overflow-y-auto py-2">
        {participants.map((participant) => {
          const isSelf = participant.id === selfId;
          const tags = [participant.is_host && "Host", isSelf && "me"].filter(Boolean);
          return (
            <li key={participant.id} className="group flex items-center gap-3 px-4 py-2 hover:bg-white/5">
              <Avatar name={participant.display_name} />
              <p className="min-w-0 flex-1 truncate text-sm">
                {participant.display_name}
                {tags.length > 0 && <span className="text-zoom-muted"> ({tags.join(", ")})</span>}
              </p>
              {isHost && !isSelf && (
                // Always visible on touch screens; on desktop they appear when hovering the row
                <div className="flex gap-1 md:invisible md:group-hover:visible">
                  {participant.audio && (
                    <button
                      onClick={() => props.onMute(participant)}
                      aria-label={`Mute ${participant.display_name}`}
                      className={`${hostButton} hover:bg-white/10`}
                    >
                      Mute
                    </button>
                  )}
                  <button
                    onClick={() => props.onRemove(participant)}
                    aria-label={`Remove ${participant.display_name}`}
                    className={`${hostButton} text-red-400 hover:bg-red-500/15`}
                  >
                    Remove
                  </button>
                </div>
              )}
              {participant.audio ? (
                <Mic className="h-4 w-4 text-zoom-muted" />
              ) : (
                <MicOff className="h-4 w-4 text-red-500" />
              )}
              {participant.video ? (
                <Video className="h-4 w-4 text-zoom-muted" />
              ) : (
                <VideoOff className="h-4 w-4 text-red-500" />
              )}
            </li>
          );
        })}
      </ul>

      {isHost && (
        <footer className="border-t border-zoom-border p-3">
          <button
            onClick={props.onMuteAll}
            className="w-full rounded-lg border border-zoom-border bg-zoom-surface-2 py-1.5 text-sm font-medium hover:bg-white/15"
          >
            Mute All
          </button>
        </footer>
      )}
    </aside>
  );
}
