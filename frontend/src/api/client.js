const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';

// Auth lives in httpOnly cookies, so JavaScript never sees a token.
// `credentials: 'include'` makes the browser send them; X-Requested-With is the
// CSRF guard the API expects on state-changing requests.
function rawFetch(method, path, body) {
  return fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Several requests can hit a 401 at once; they all share ONE refresh call.
let refreshInFlight = null;
function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch('POST', '/auth/refresh')
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// Endpoints where a 401 means "wrong credentials / no session", not "token expired".
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

async function request(method, path, body) {
  let res = await rawFetch(method, path, body);

  if (res.status === 401 && !NO_REFRESH.includes(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await rawFetch(method, path, body);
    } else {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export const api = {
  auth: {
    register: (body) => request('POST', '/auth/register', body),
    login: (body) => request('POST', '/auth/login', body),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
  },
  exercises: {
    list: () => request('GET', '/exercises'),
    get: (id) => request('GET', `/exercises/${id}`),
    create: (body) => request('POST', '/exercises', body),
    update: (id, body) => request('PUT', `/exercises/${id}`, body),
    delete: (id) => request('DELETE', `/exercises/${id}`),
  },
  workouts: {
    list: () => request('GET', '/workouts'),
    get: (id) => request('GET', `/workouts/${id}`),
    create: (body) => request('POST', '/workouts', body),
    update: (id, body) => request('PUT', `/workouts/${id}`, body),
    delete: (id) => request('DELETE', `/workouts/${id}`),
  },
  progress: {
    list: () => request('GET', '/progress'),
    create: (body) => request('POST', '/progress', body),
    delete: (id) => request('DELETE', `/progress/${id}`),
  },
  users: {
    list: () => request('GET', '/users'),
    updateRole: (id, role) => request('PATCH', `/users/${id}/role`, { role }),
  },
};