// services/api.ts
const API = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function joinUrl(base: string, path: string) {
  // supports both "/projects" and "projects"
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  if (path.startsWith("http")) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * Lowest-level fetch helper: returns Response.
 * Use this when you need access to headers/streams/etc.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  authToken?: string | null,
) {
  const res = await fetch(joinUrl(API!, path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  return res;
}

async function parseApiError(res: Response): Promise<ApiError> {
  let code: string | undefined;
  let message = `Request failed (${res.status})`;

  // Try JSON first (FastAPI usually returns JSON)
  try {
    const body = await res.clone().json();
    const detail = body?.detail;

    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object") {
      code = detail.code;
      message = detail.message ?? message;
    }
  } catch {
    // fallback to text
    try {
      const text = await res.clone().text();
      if (text) message = text;
    } catch {
      // ignore
    }
  }

  return new ApiError(message, res.status, code);
}

/**
 * Typed JSON helper: returns parsed JSON or throws ApiError.
 */
export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {},
  authToken?: string | null,
): Promise<T> {
  const res = await apiFetch(path, init, authToken);

  if (res.ok) {
    // handle 204 No Content safely
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  }

  throw await parseApiError(res);
}
