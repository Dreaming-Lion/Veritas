// src/services/auth.ts
const API_BASE = import.meta.env.API_BASE ?? "/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string; 
};

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j?.message || j?.detail || `login failed (${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}

export async function signup(payload: SignupPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      passwordConfirm: payload.passwordConfirm,
      password_confirm: payload.passwordConfirm,
    }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j?.message || j?.detail || `signup failed (${res.status})`;
    throw new Error(msg);
  }
}
