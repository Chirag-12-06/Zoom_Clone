import { formatDayLabel, formatMeetingCode, formatTime } from "@/lib/format";
import type { Meeting } from "@/lib/types";

export default function UpcomingMeetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-500">No upcoming meetings</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {meetings.map((meeting) => {
        // Upcoming meetings are always scheduled ones, so these fields are set
        const start = new Date(meeting.scheduled_start!);
        const end = new Date(start.getTime() + meeting.duration_minutes! * 60_000);
        return (
          <li key={meeting.code} className="px-5 py-4">
            <p className="text-xs font-medium text-gray-500">
              {formatDayLabel(start)} · {formatTime(start)} – {formatTime(end)}
            </p>
            <p className="mt-0.5 font-semibold text-gray-900">{meeting.title}</p>
            <p className="text-xs text-gray-500">Meeting ID: {formatMeetingCode(meeting.code)}</p>
          </li>
        );
      })}
    </ul>
  );
}
