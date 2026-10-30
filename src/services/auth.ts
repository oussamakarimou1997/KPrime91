import { AuthUser } from '../types';

const TOKEN_KEY = 'kprime_auth_token_v1';
const USER_KEY = 'kprime_auth_user_v1';

let cachedUser: AuthUser | null = null;
let cachedToken: string | null = null;

export function getAuthToken(): string | null {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = localStorage.getItem(TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (cachedUser) return cachedUser;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      cachedUser = JSON.parse(raw);
      return cachedUser;
    }
  } catch (e) {
    console.error('Failed to parse cached user:', e);
  }
  return null;
}

export async function fetchAuthorizedUsers(): Promise<AuthUser[]> {
  try {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (err) {
    console.error('Error fetching authorized users:', err);
  }
  return [];
}

export async function loginAsUser(userId: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Authentication failed' };
    }

    cachedToken = data.token;
    cachedUser = data.user;

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    window.dispatchEvent(new CustomEvent('kprime_auth_changed', { detail: { user: data.user } }));

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during login' };
  }
}

export function logout(): void {
  cachedToken = null;
  cachedUser = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('kprime_auth_changed', { detail: { user: null } }));
}

export async function initAuth(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          cachedUser = data.user;
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch {
      // If server unreachable, fallback to cached
    }
  }

  // If no session exists yet, default to first authorized user for smooth initial experience
  const users = await fetchAuthorizedUsers();
  const defaultUser = users.find((u) => u.status === 'active') || users[0];
  if (defaultUser) {
    const loginRes = await loginAsUser(defaultUser.id);
    if (loginRes.success && loginRes.user) {
      return loginRes.user;
    }
  }

  return getCurrentUser();
}
