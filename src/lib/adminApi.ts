export interface AdminResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Server-provided, user-safe message (the admin API never returns raw database errors). */
  error: string | null;
}

/**
 * fetch() wrapper for /api/admin/* — always sends the session cookie, never throws (network
 * failures come back as status 0), and surfaces the API's `error` message when there is one.
 */
export async function adminRequest<T>(url: string, init: RequestInit = {}): Promise<AdminResponse<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: init.body ? { 'Content-Type': 'application/json', ...(init.headers ?? {}) } : init.headers
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const error =
      !response.ok && body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : null;
    return { ok: response.ok, status: response.status, data: response.ok ? (body as T) : null, error };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Network error — check your connection and try again.' };
  }
}
