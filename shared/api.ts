export async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = process.env.VITE_USERS_DATA_API || "";
  if (!baseUrl) throw new Error("VITE_USERS_DATA_API is not defined!");

  const token = localStorage.getItem("token");

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