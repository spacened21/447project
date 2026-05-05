export const API_BASE = "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return response;
}

// For file uploads - don't set Content-Type (browser sets it with multipart boundary)
export async function apiUpload(path, formData, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
  });

  return response;
}