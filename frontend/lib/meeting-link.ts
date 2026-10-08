/** URL of the meeting room. `host` marks the person who started it from the dashboard. */
export function roomUrl(code: string, passcode: string, options: { host?: boolean } = {}): string {
  const params = new URLSearchParams({ pwd: passcode });
  if (options.host) params.set("host", "1");
  return `/meeting/${code}?${params}`;
}

/**
 * Shareable invite link, e.g. http://localhost:3000/j/84213976502?pwd=Ab12Cd
 * Uses window, so only call it in the browser (event handlers, or after data has loaded).
 */
export function inviteLink(code: string, passcode: string): string {
  return `${window.location.origin}/j/${code}?pwd=${encodeURIComponent(passcode)}`;
}
