"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ActionTiles from "@/components/dashboard/ActionTiles";
import ClockCard from "@/components/dashboard/ClockCard";
import MeetingsCard from "@/components/dashboard/MeetingsCard";
import NavRail from "@/components/dashboard/NavRail";
import ScheduleModal from "@/components/dashboard/ScheduleModal";
import TopNav from "@/components/dashboard/TopNav";
import { ApiError, createInstantMeeting, getMe, getRecentMeetings, getUpcomingMeetings } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { roomUrl } from "@/lib/meeting-link";
import type { Meeting, RecentMeeting, User } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    // The dashboard is for logged-in users; guests can still use /join and invite links
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    // Fetch all three in parallel
    Promise.all([getMe(), getUpcomingMeetings(), getRecentMeetings()])
      .then(([me, upcomingMeetings, recentMeetings]) => {
        setUser(me);
        setUpcoming(upcomingMeetings);
        setRecent(recentMeetings);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          // Token expired or invalid: log in again
          clearToken();
          router.replace("/login");
        } else {
          setError("Can't reach the server. Is the backend running?");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function signOut() {
    clearToken();
    router.replace("/login");
  }

  async function handleNewMeeting() {
    if (creating) return; // ignore double clicks
    setCreating(true);
    try {
      const meeting = await createInstantMeeting();
      router.push(roomUrl(meeting.code, meeting.passcode, { host: true }));
    } catch {
      setError("Couldn't start a meeting. Please try again.");
      setCreating(false);
    }
  }

  return (
    // Zoom Workplace layout: top bar, left rail, and the home screen in a rounded panel
    <div className="flex h-dvh flex-col bg-zoom-chrome">
      <TopNav user={user} onSignOut={signOut} />

      <div className="flex min-h-0 flex-1">
        <NavRail />
        <main className="flex-1 overflow-y-auto bg-zoom-bg sm:mb-2 sm:mr-2 sm:rounded-xl">
          {error && <p className="bg-red-500/15 px-4 py-2 text-center text-sm text-red-300">{error}</p>}

          <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:py-16">
            <ClockCard />
            <ActionTiles
              onNewMeeting={handleNewMeeting}
              onJoin={() => router.push("/join")}
              onSchedule={() => setScheduleOpen(true)}
            />
            <MeetingsCard
              loading={loading}
              upcoming={upcoming}
              recent={recent}
              onSchedule={() => setScheduleOpen(true)}
            />
          </div>
        </main>
      </div>

      {scheduleOpen && user && (
        <ScheduleModal
          user={user}
          onClose={() => setScheduleOpen(false)}
          onScheduled={() => getUpcomingMeetings().then(setUpcoming)}
        />
      )}
    </div>
  );
}
