import Link from "next/link";

import { formatDayLabel, formatMeetingCode, formatTime } from "@/lib/format";
import { roomUrl } from "@/lib/meeting-link";
import type { Meeting } from "@/lib/types";

/** Scheduled meetings, soonest first. The empty state lives in MeetingsCard. */
export default function UpcomingMeetings({ meetings }: { meetings: Meeting[] }) {
  return (
    <ul className="divide-y divide-zoom-border">
      {meetings.map((meeting) => {
        // Upcoming meetings are always scheduled ones, so these fields are set
        const start = new Date(meeting.scheduled_start!);
        const end = new Date(start.getTime() + meeting.duration_minutes! * 60_000);
        return (
          <li key={meeting.code} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zoom-muted">
                {formatDayLabel(start)} · {formatTime(start)} – {formatTime(end)}
              </p>
              <p className="mt-0.5 truncate font-semibold">{meeting.title}</p>
              <p className="text-xs text-zoom-muted">Meeting ID: {formatMeetingCode(meeting.code)}</p>
            </div>
            <Link
              href={roomUrl(meeting.code, meeting.passcode)}
              className="rounded-lg bg-zoom-blue px-4 py-1.5 text-sm font-medium hover:bg-zoom-blue-dark"
            >
              Start
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
