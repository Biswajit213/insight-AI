/**
 * apiClient.ts
 *
 * Authenticated fetch wrapper.
 * Sends both Authorization: Bearer <token> AND x-user-email header
 * so the backend auth middleware can always identify the user even if
 * the token stored in localStorage is from an older session.
 */

function getToken(): string {
  return localStorage.getItem('insightai_token') || '';
}

function getUserEmail(): string {
  return localStorage.getItem('insightai_user_email') || '';
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = path;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    url = `${path}?${qs}`;
  }

  const token = getToken();
  const email = getUserEmail();

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Always send email as fallback identifier — auth middleware Strategy 3
      ...(email ? { 'x-user-email': email } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string, params?: Record<string, string | number | boolean>) =>
    request<T>(path, { method: 'GET', params }),

  post:   <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
