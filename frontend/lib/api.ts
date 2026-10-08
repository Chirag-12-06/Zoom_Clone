import type { Meeting, MeetingPublic, RecentMeeting, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    // FastAPI puts error messages in "detail"
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new ApiError(response.status, detail);
  }
  return response.json();
}

export const getMe = () => request<User>("/api/me");

export const getUpcomingMeetings = () => request<Meeting[]>("/api/meetings/upcoming");

export const getRecentMeetings = () => request<RecentMeeting[]>("/api/meetings/recent");

export const createInstantMeeting = () => request<Meeting>("/api/meetings/instant", { method: "POST" });

export const getMeeting = (code: string) => request<MeetingPublic>(`/api/meetings/${code}`);

/** Checks the meeting exists, the passcode is right and it hasn't ended. Throws ApiError otherwise. */
export const checkJoin = (code: string, passcode: string, displayName: string) =>
  request<MeetingPublic>(`/api/meetings/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ passcode, display_name: displayName }),
  });
