import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import type { Participant } from "@/lib/types";

type ParticipantsPanelProps = {
  participants: Participant[];
  selfId: number;
  onClose: () => void;
};

/** Side panel on desktop, full-screen sheet on phones */
export default function ParticipantsPanel({ participants, selfId, onClose }: ParticipantsPanelProps) {
  return (
    <aside className="fixed inset-0 z-20 flex flex-col bg-white text-gray-900 md:static md:w-80 md:shrink-0 md:border-l md:border-gray-200">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Participants ({participants.length})</h2>
        <button onClick={onClose} aria-label="Close participants" className="rounded p-1 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </header>

      <ul className="flex-1 overflow-y-auto py-2">
        {participants.map((participant) => {
          const tags = [participant.is_host && "Host", participant.id === selfId && "me"].filter(Boolean);
          return (
            <li key={participant.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50">
              <Avatar name={participant.display_name} />
              <p className="min-w-0 flex-1 truncate text-sm">
                {participant.display_name}
                {tags.length > 0 && <span className="text-gray-500"> ({tags.join(", ")})</span>}
              </p>
              {participant.audio ? (
                <Mic className="h-4 w-4 text-gray-500" />
              ) : (
                <MicOff className="h-4 w-4 text-red-500" />
              )}
              {participant.video ? (
                <Video className="h-4 w-4 text-gray-500" />
              ) : (
                <VideoOff className="h-4 w-4 text-red-500" />
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
