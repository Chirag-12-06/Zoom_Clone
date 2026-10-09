type RoomOptions = {
  name?: string; // display name entered on the join screen
};

/** URL of the meeting room, e.g. /meeting/84213976502?pwd=Ab12Cd&name=Asha */
export function roomUrl(code: string, passcode: string, options: RoomOptions = {}): string {
  const params = new URLSearchParams({ pwd: passcode });
  if (options.name) params.set("name", options.name);
  return `/meeting/${code}?${params}`;
}

/**
 * Shareable invite link, e.g. http://localhost:3000/j/84213976502?pwd=Ab12Cd
 * Uses window, so only call it in the browser (event handlers, or after data has loaded).
 */
export function inviteLink(code: string, passcode: string): string {
  return `${window.location.origin}/j/${code}?pwd=${encodeURIComponent(passcode)}`;
}

/**
 * Understands what people paste into the "Meeting ID or link" box:
 *   "84213976502", "842 1397 6502", "842-1397-6502"  -> { code }
 *   "http://localhost:3000/j/84213976502?pwd=Ab12Cd" -> { code, passcode }
 * Returns null if it's neither.
 */
export function parseMeetingInput(input: string): { code: string; passcode: string } | null {
  const link = input.match(/\/j\/(\d{11})/);
  if (link) {
    const pwd = input.match(/[?&]pwd=([^&#\s]+)/);
    return { code: link[1], passcode: pwd ? decodeURIComponent(pwd[1]) : "" };
  }

  const digits = input.replace(/[\s-]/g, "");
  return /^\d{11}$/.test(digits) ? { code: digits, passcode: "" } : null;
}
