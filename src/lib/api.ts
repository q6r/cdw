// Cliente da API da loja. Mesmo contrato do front anterior: JSON, cookie de
// sessão same-origin e o cabeçalho X-CDW-Request em toda escrita.

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let onUnauthenticated: (() => void) | null = null;

/** O AuthProvider registra aqui o que fazer quando a sessão expira. */
export function setUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticated = handler;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CDW-Request"] = "1";
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError("sem conexão com o servidor", 0);
  }

  const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
  if (res.status === 401 && data?.code === "unauthenticated") onUnauthenticated?.();
  if (!res.ok) throw new ApiError(data?.error ?? "algo deu errado, tente de novo", res.status, data?.code);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, "POST", body),
  patch: <T>(path: string, body?: unknown) => request<T>(path, "PATCH", body),
  del: <T>(path: string) => request<T>(path, "DELETE"),
};

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "algo deu errado");
