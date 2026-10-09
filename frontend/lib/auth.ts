// The login token (a JWT from the backend), kept in localStorage so it survives reloads and
// works across our two domains (Vercel frontend, Render backend).
// Trade-off: JavaScript on the page can read it, so it matters to avoid XSS; React escapes
// everything it renders by default.
const TOKEN_KEY = "zoom-clone:token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null; // server render
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage blocked (e.g. strict privacy mode)
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked: the user stays logged in only until the page reloads
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}
