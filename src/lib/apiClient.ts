/**
 * apiClient.ts
 *
 * Authenticated fetch wrapper. Automatically attaches the
 * Authorization: Bearer <token> header from localStorage so every
 * API call is properly tied to the logged-in user.
 */

function getToken(): string {
  return localStorage.getItem('insightai_token') || '';
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  // Build query string if params are provided
  let url = path;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    url = `${path}?${qs}`;
  }

  const token = getToken();
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | boolean>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
