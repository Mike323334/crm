import { apiRequest, apiFormRequest, API_URL } from "./api";

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

export const getActivityNotifications = (token, days = 7) =>
  apiRequest(`/api/activities/notifications?days=${days}`, { token });

export const listInvites = (token) => apiRequest("/api/invites", { token });

export const createInvite = (token, payload) =>
  apiRequest("/api/invites", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });

export const revokeInvite = (token, id) =>
  apiRequest(`/api/invites/${id}/revoke`, {
    token,
    method: "PUT"
  });

export const listPipelines = (token) => apiRequest("/api/pipelines", { token });

export const createPipeline = (token, payload) =>
  apiRequest("/api/pipelines", {
    token,
    method: "POST",
    body: JSON.stringify(payload)
  });

export const updatePipeline = (token, id, payload) =>
  apiRequest(`/api/pipelines/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const getPipelineAnalytics = (token, id) =>
  apiRequest(`/api/pipelines/${id}/analytics`, { token });

export const listUsers = (token) => apiRequest("/api/users", { token });

export const updateUserRole = (token, id, role) =>
  apiRequest(`/api/users/${id}/role`, {
    token,
    method: "PUT",
    body: JSON.stringify({ role })
  });

export const updateUserStatus = (token, id, isActive) =>
  apiRequest(`/api/users/${id}/status`, {
    token,
    method: "PUT",
    body: JSON.stringify({ isActive })
  });

export const resetUserPassword = (token, id, password) =>
  apiRequest(`/api/users/${id}/password`, {
    token,
    method: "PUT",
    body: JSON.stringify({ password })
  });

export const listAttachments = (token, contactId, dealId) => {
  const params = new URLSearchParams();
  if (contactId) params.append("contactId", contactId);
  if (dealId) params.append("dealId", dealId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/api/files${query}`, { token });
};

export const uploadAttachment = (token, { contactId, dealId, file }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (contactId) formData.append("contactId", contactId);
  if (dealId) formData.append("dealId", dealId);
  return apiFormRequest("/api/files", formData, token);
};

export const deleteAttachment = (token, id) =>
  apiRequest(`/api/files/${id}`, { token, method: "DELETE" });

export const resolveFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
};
