import { Users } from "lucide-react";

import { formatDayLabel, formatMeetingCode, formatTime } from "@/lib/format";
import type { RecentMeeting } from "@/lib/types";

export default function RecentMeetings({ meetings }: { meetings: RecentMeeting[] }) {
  if (meetings.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No recent meetings</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {meetings.map((meeting) => {
        const started = new Date(meeting.started_at!);
        return (
          <li key={meeting.code} className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{meeting.title}</p>
              <p className="text-xs text-gray-500">
                {formatDayLabel(started)} · {formatTime(started)} · ID {formatMeetingCode(meeting.code)}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {meeting.participant_count}
            </span>
            {meeting.ended_at ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Ended</span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Live</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
