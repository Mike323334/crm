import { apiRequest } from "./api";

export const register = (payload) =>
  apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const login = (email, password) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const getMe = (token) => apiRequest("/api/auth/me", { token });
