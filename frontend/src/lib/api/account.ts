const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3009";

export async function fetchProfile() {
  const response = await fetch(`${API_BASE}/api/account/profile`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function updateProfile(data: { name?: string }) {
  const response = await fetch(`${API_BASE}/api/account/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return response.json();
}
