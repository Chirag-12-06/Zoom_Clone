"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MeetingInfo from "@/components/meeting/MeetingInfo";
import { ApiError, getMeeting } from "@/lib/api";
import type { MeetingPublic } from "@/lib/types";

type MeetingRoomProps = {
  code: string;
  passcode: string;
  isHost: boolean;
  displayName: string;
};

export default function MeetingRoom({ code, passcode }: MeetingRoomProps) {
  const [meeting, setMeeting] = useState<MeetingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeeting(code)
      .then(setMeeting)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "Meeting not found" : "Something went wrong"),
      );
  }, [code]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-meeting-bg p-4 text-white">
      {error && <p className="text-lg">{error}</p>}
      {!error && !meeting && <p className="text-gray-400">Loading meeting…</p>}
      {meeting && <MeetingInfo meeting={meeting} passcode={passcode} />}

      <Link href="/" className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium hover:bg-red-700">
        Leave
      </Link>
    </main>
  );
}
