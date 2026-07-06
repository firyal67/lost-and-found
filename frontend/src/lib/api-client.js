const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.response = data;
    throw err;
  }

  return data;
}

export default apiFetch;
