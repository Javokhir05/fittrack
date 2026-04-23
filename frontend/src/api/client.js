const BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export const api = {
  auth: {
    register: (body) => request('POST', '/auth/register', body),
    login: (body) => request('POST', '/auth/login', body),
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
