export async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = import.meta.env.VITE_USERS_DATA_API;
  if (!baseUrl) throw new Error("VITE_USERS_DATA_API is not defined!");

  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${baseUrl}/api/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`);
  }

  return res.json();
}


// src/shared/apiBackend.ts
const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error("VITE_API_URL is not defined in your environment variables!");
}

export async function fetchApiBackend<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const url = `${API_BASE}/api/${endpoint.replace(/^\/+/, "")}`; 

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message || `API request failed with status ${res.status}`);
    return data;
  } catch (err) {
    console.error("API returned non-JSON response:", text);
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
}
