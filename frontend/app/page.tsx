"use client";

import { useEffect, useState } from "react";

import ActionTiles from "@/components/dashboard/ActionTiles";
import ClockCard from "@/components/dashboard/ClockCard";
import RecentMeetings from "@/components/dashboard/RecentMeetings";
import TopNav from "@/components/dashboard/TopNav";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import { getMe, getRecentMeetings, getUpcomingMeetings } from "@/lib/api";
import type { Meeting, RecentMeeting, User } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all three in parallel
    Promise.all([getMe(), getUpcomingMeetings(), getRecentMeetings()])
      .then(([me, upcomingMeetings, recentMeetings]) => {
        setUser(me);
        setUpcoming(upcomingMeetings);
        setRecent(recentMeetings);
      })
      .catch(() => setError("Can't reach the server. Is the backend running?"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopNav user={user} />

      {error && <p className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</p>}

      <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-10 px-4 py-10 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-10">
          <div className="py-6">
            <ActionTiles />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Recent meetings</h2>
            <RecentMeetings meetings={recent} />
          </div>
        </section>

        <section className="h-fit min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ClockCard />
          <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">
            Upcoming meetings
          </h2>
          <UpcomingMeetings meetings={upcoming} />
        </section>
      </main>
    </div>
  );
}
