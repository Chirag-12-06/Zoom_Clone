"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { formatMeetingCode } from "@/lib/format";
import { inviteLink } from "@/lib/meeting-link";
import type { MeetingPublic } from "@/lib/types";

type MeetingInfoProps = {
  meeting: MeetingPublic;
  passcode: string;
};

/** Zoom's "meeting information" card: ID, host, passcode and a copyable invite link */
export default function MeetingInfo({ meeting, passcode }: MeetingInfoProps) {
  const [copied, setCopied] = useState(false);
  const link = inviteLink(meeting.code, passcode);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-zoom-border bg-zoom-surface p-6 text-white shadow-2xl">
      <h2 className="text-lg font-semibold">{meeting.title}</h2>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-zoom-muted">Meeting ID</dt>
        <dd className="font-medium">{formatMeetingCode(meeting.code)}</dd>
        <dt className="text-zoom-muted">Host</dt>
        <dd className="font-medium">{meeting.host_name}</dd>
        <dt className="text-zoom-muted">Passcode</dt>
        <dd className="font-medium">{passcode}</dd>
        <dt className="text-zoom-muted">Invite link</dt>
        <dd className="truncate text-[#4b8bff]">{link}</dd>
      </dl>

      <button
        onClick={copyLink}
        className="mt-5 flex items-center gap-2 rounded-lg bg-zoom-blue px-4 py-2 text-sm font-medium text-white hover:bg-zoom-blue-dark"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
