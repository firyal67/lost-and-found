const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // envoie le cookie refreshToken automatiquement
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || "Request failed") as Error & {
      response: ApiResponse<T>;
    };
    err.response = data;
    throw err;
  }

  return data;
}

export default apiFetch;
