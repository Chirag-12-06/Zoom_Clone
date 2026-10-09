import { Users } from "lucide-react";

import { formatDayLabel, formatMeetingCode, formatTime } from "@/lib/format";
import type { RecentMeeting } from "@/lib/types";

/** Meetings that have started, newest first. The empty state lives in MeetingsCard. */
export default function RecentMeetings({ meetings }: { meetings: RecentMeeting[] }) {
  return (
    <ul className="divide-y divide-zoom-border">
      {meetings.map((meeting) => {
        const started = new Date(meeting.started_at!);
        return (
          <li key={meeting.code} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{meeting.title}</p>
              <p className="text-xs text-zoom-muted">
                {formatDayLabel(started)} · {formatTime(started)} · ID {formatMeetingCode(meeting.code)}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-zoom-muted">
              <Users className="h-3.5 w-3.5" />
              {meeting.participant_count}
            </span>
            {meeting.ended_at ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">Ended</span>
            ) : (
              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">Live</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
