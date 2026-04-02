const BASE = `${import.meta.env.VITE_API_URL}/api/notes`;

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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load notes');
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to save notes');
    }
    return res.json();
  },
};