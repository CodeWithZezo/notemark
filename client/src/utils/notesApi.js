const BASE = '/api/notes';

const TIMEOUT_MS = 15_000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const notesApi = {
  getState: async (token) => {
    const res = await fetchWithTimeout(BASE, { headers: headers(token) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to load notes');
    }
    return res.json();
  },

  saveState: async (token, state) => {
    const res = await fetchWithTimeout(BASE, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to save notes');
    }
    return res.json();
  },

  updateFile: async (token, fileId, { title, content }) => {
    const res = await fetchWithTimeout(`${BASE}/file/${fileId}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to update file');
    }
    return res.json();
  },

  deleteFile: async (token, fileId) => {
    const res = await fetchWithTimeout(`${BASE}/file/${fileId}`, {
      method: 'DELETE',
      headers: headers(token),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to delete file');
    }
    return res.json();
  },
};
