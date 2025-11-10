// frontend/src/services/auth.ts
const API_BASE = "/api"; 

export async function signup(payload: {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
}) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `signup failed (${res.status})`);
  }
  return res.json();
}

export async function login(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `login failed (${res.status})`);
  }
  return res.json();
}
