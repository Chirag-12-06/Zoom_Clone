// Mirrors the Pydantic response models in backend/app/schemas.py

export type User = {
  id: number;
  name: string;
  email: string;
};

export type Meeting = {
  code: string;
  passcode: string;
  type: "instant" | "scheduled";
  title: string;
  description: string | null;
  scheduled_start: string | null; // ISO 8601, UTC
  duration_minutes: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  invite_link: string;
};

export type RecentMeeting = Meeting & {
  participant_count: number;
};

/** What anyone with the meeting ID can see (no passcode) */
export type MeetingPublic = {
  code: string;
  title: string;
  host_name: string;
  has_ended: boolean;
};

/** Someone in the meeting room, as shown in the video grid and participants panel */
export type Participant = {
  id: number;
  display_name: string;
  is_host: boolean;
  audio: boolean; // mic on
  video: boolean; // camera on
};
