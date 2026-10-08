"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, checkJoin } from "@/lib/api";
import { parseMeetingInput, roomUrl } from "@/lib/meeting-link";

// Turn the backend's status codes into messages people understand
const ERROR_MESSAGES: Record<number, string> = {
  404: "This meeting ID is not valid. Please check and try again.",
  403: "Incorrect passcode.",
  410: "This meeting has ended.",
};

type JoinFormProps = {
  initialCode?: string;
  initialPasscode?: string;
};

export default function JoinForm({ initialCode = "", initialPasscode = "" }: JoinFormProps) {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState(initialCode);
  const [passcode, setPasscode] = useState(initialPasscode);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleMeetingInputChange(value: string) {
    setMeetingInput(value);
    // If they pasted a full invite link, pull the passcode out of it
    const parsed = parseMeetingInput(value);
    if (parsed?.passcode) setPasscode(parsed.passcode);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser's default full-page form submit
    setError(null);

    const parsed = parseMeetingInput(meetingInput);
    if (!parsed) {
      setError("Enter an 11-digit meeting ID or an invite link.");
      return;
    }

    setSubmitting(true);
    try {
      await checkJoin(parsed.code, passcode, name.trim());
      router.push(roomUrl(parsed.code, passcode, { name: name.trim() }));
    } catch (err) {
      const message = err instanceof ApiError ? ERROR_MESSAGES[err.status] : undefined;
      setError(message ?? "Couldn't join the meeting. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-zoom-blue focus:ring-1 focus:ring-zoom-blue";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Meeting ID or invite link
        <input
          value={meetingInput}
          onChange={(e) => handleMeetingInputChange(e.target.value)}
          placeholder="842 1397 6502"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Passcode
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Meeting passcode"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Your name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={50}
          autoFocus={Boolean(initialCode)} // came from an invite link: only the name is missing
          className={inputClass}
        />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* All three fields are required, so the button stays disabled until they're filled */}
      <button
        type="submit"
        disabled={submitting || !meetingInput.trim() || !passcode.trim() || !name.trim()}
        className="rounded-lg bg-zoom-blue py-2.5 text-sm font-semibold text-white hover:bg-zoom-blue-dark disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting ? "Joining…" : "Join"}
      </button>
    </form>
  );
}
