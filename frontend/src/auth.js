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

export const forgotPassword = (email) =>
  apiRequest("/api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email })
  });

export const resetPassword = (token, password) =>
  apiRequest("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
