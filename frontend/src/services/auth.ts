import { apiPOST } from "../lib/api";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}
export interface UserOut {
  id: number;
  nickname: string;
  email: string;
  created_at: string;
}
export interface TokenOut {
  access_token: string;
  token_type: string; // "bearer"
}

export async function signup(payload: SignupPayload) {
  return apiPOST<UserOut>("/auth/signup", payload);
}

export async function login(payload: LoginPayload) {
  return apiPOST<TokenOut>("/auth/login", payload);
}
