/** Error shape returned by the API on non-2xx responses. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

const API_BASE = '/api/v1/blueprint';

let apiKey = '';

// Read persisted key only in browser context (avoid SSR / test errors)
if (typeof window !== 'undefined') {
  apiKey = localStorage.getItem('ctrlpane_api_key') ?? '';
}

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('ctrlpane_api_key', key);
};

export const getApiKey = () => apiKey;

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new ApiClientError(response.status, error.error.code, error.error.message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
