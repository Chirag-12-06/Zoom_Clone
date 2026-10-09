"use client";

import { useState } from "react";

import MeetingInfo from "@/components/meeting/MeetingInfo";
import Modal from "@/components/ui/Modal";
import { ApiError, scheduleMeeting } from "@/lib/api";
import type { Meeting, User } from "@/lib/types";

const DURATIONS = [15, 30, 45, 60, 90, 120];

// <input type="date"> and <input type="time"> work with "YYYY-MM-DD" and "HH:MM" strings in local time
const pad = (n: number) => String(n).padStart(2, "0");
const toDateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** The next full half hour, e.g. 14:10 -> 14:30, 14:40 -> 15:00 */
function nextHalfHour(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d;
}

type ScheduleModalProps = {
  user: User;
  onClose: () => void;
  onScheduled: () => void;
};

export default function ScheduleModal({ user, onClose, onScheduled }: ScheduleModalProps) {
  const [defaultStart] = useState(nextHalfHour);
  const [title, setTitle] = useState(`${user.name}'s Zoom Meeting`);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateValue(defaultStart));
  const [time, setTime] = useState(toTimeValue(defaultStart));
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scheduled, setScheduled] = useState<Meeting | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // No timezone in the string, so the browser reads it as local time
    const start = new Date(`${date}T${time}`);
    if (start <= new Date()) {
      setError("Pick a time in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const meeting = await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || null,
        start_time: start.toISOString(), // UTC, e.g. "2026-10-09T10:00:00.000Z"
        duration_minutes: duration,
      });
      setScheduled(meeting);
      onScheduled();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? "Please check the details."
          : "Couldn't schedule the meeting.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // After scheduling, show the meeting details so the host can copy the invite
  if (scheduled) {
    return (
      <Modal onClose={onClose}>
        <div className="flex flex-col items-center gap-4">
          <MeetingInfo
            meeting={{ code: scheduled.code, title: scheduled.title, host_name: user.name, has_ended: false }}
            passcode={scheduled.passcode}
          />
          <button
            onClick={onClose}
            className="rounded-lg bg-zoom-surface-2 px-6 py-2 text-sm font-medium hover:bg-white/15"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-zoom-border bg-zoom-surface-2 px-3 py-2 text-sm text-white outline-none [color-scheme:dark] focus:border-zoom-blue focus:ring-1 focus:ring-zoom-blue";
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-gray-200";

  return (
    <Modal onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-zoom-border bg-zoom-surface p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">Schedule meeting</h2>

        <label className={labelClass}>
          Topic
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Date
            <input
              type="date"
              value={date}
              min={toDateValue(new Date())}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className={inputClass}
            />
          </label>
        </div>

        <label className={labelClass}>
          Duration
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={inputClass}
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-semibold text-white hover:bg-zoom-blue-dark disabled:bg-zoom-surface-2 disabled:text-zoom-muted"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
