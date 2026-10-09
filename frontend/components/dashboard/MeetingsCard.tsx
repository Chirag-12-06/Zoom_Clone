"use client";

import { Plus, Umbrella } from "lucide-react";
import { useState } from "react";

import RecentMeetings from "@/components/dashboard/RecentMeetings";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import type { Meeting, RecentMeeting } from "@/lib/types";

type MeetingsCardProps = {
  loading: boolean;
  upcoming: Meeting[];
  recent: RecentMeeting[];
  onSchedule: () => void;
};

/** Zoom's home-screen meetings card: today's date, Upcoming / Recent tabs and the list */
export default function MeetingsCard({ loading, upcoming, recent, onSchedule }: MeetingsCardProps) {
  const [tab, setTab] = useState<"upcoming" | "recent">("upcoming");
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <section className="mx-auto w-full max-w-[730px] overflow-hidden rounded-xl border border-zoom-border bg-zoom-surface">
      <header className="relative flex h-14 items-center justify-center bg-zoom-surface-2 px-4">
        <button
          onClick={onSchedule}
          aria-label="Schedule a meeting"
          className="absolute left-3 rounded-md p-1.5 text-gray-300 hover:bg-white/10"
        >
          <Plus className="h-5 w-5" />
        </button>
        <h2 className="font-semibold" suppressHydrationWarning>
          {today}
        </h2>
      </header>

      <div className="flex gap-2 border-b border-zoom-border px-4 py-3">
        <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming meetings
        </TabButton>
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
          Recent meetings
        </TabButton>
      </div>

      <div className="min-h-64">
        {loading ? (
          <p className="py-16 text-center text-sm text-zoom-muted">Loading…</p>
        ) : tab === "upcoming" ? (
          upcoming.length > 0 ? (
            <UpcomingMeetings meetings={upcoming} />
          ) : (
            // Zoom's empty state: an illustration, a message and a shortcut to Schedule
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Umbrella className="mb-3 h-20 w-20 text-zoom-muted/60" strokeWidth={1.2} />
              <p>No upcoming meetings</p>
              <button onClick={onSchedule} className="flex items-center gap-1 text-zoom-blue hover:underline">
                <Plus className="h-4 w-4" /> Schedule a meeting
              </button>
            </div>
          )
        ) : recent.length > 0 ? (
          <RecentMeetings meetings={recent} />
        ) : (
          <p className="py-16 text-center text-sm text-zoom-muted">No recent meetings</p>
        )}
      </div>
    </section>
  );
}

type TabButtonProps = { active: boolean; onClick: () => void; children: React.ReactNode };

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${
        active
          ? "border-white/40 bg-white/10 text-white"
          : "border-zoom-border text-zoom-muted hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
