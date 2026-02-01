import { apiRequest } from "./api";

export const getDashboard = (token) => apiRequest("/api/dashboard", { token });

export const listContacts = (token, search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest(`/api/contacts${query}`, { token });
};

export const createContact = (token, payload) =>
  apiRequest("/api/contacts", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateContact = (token, id, payload) =>
  apiRequest(`/api/contacts/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteContact = (token, id) =>
  apiRequest(`/api/contacts/${id}`, { token, method: "DELETE" });

export const getContact = (token, id) =>
  apiRequest(`/api/contacts/${id}`, { token });

export const listDeals = (token, contactId) => {
  const query = contactId ? `?contactId=${contactId}` : "";
  return apiRequest(`/api/deals${query}`, { token });
};

export const createDeal = (token, payload) =>
  apiRequest("/api/deals", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateDeal = (token, id, payload) =>
  apiRequest(`/api/deals/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteDeal = (token, id) =>
  apiRequest(`/api/deals/${id}`, { token, method: "DELETE" });

export const listActivities = (token, contactId) => {
  const query = contactId ? `?contactId=${contactId}` : "";
  return apiRequest(`/api/activities${query}`, { token });
};

export const createActivity = (token, payload) =>
  apiRequest("/api/activities", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updateActivity = (token, id, payload) =>
  apiRequest(`/api/activities/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteActivity = (token, id) =>
  apiRequest(`/api/activities/${id}`, { token, method: "DELETE" });

export const listInvites = (token) => apiRequest("/api/invites", { token });

export const createInvite = (token, payload) =>
  apiRequest("/api/invites", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });
