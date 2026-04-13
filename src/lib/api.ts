const URLS = {
  auth: 'https://functions.poehali.dev/7732b0ba-68d1-4714-a7b3-cf8ddab2c5af',
  wiki: 'https://functions.poehali.dev/cdbff17e-abc9-4dea-846a-934223c03a2a',
  users: 'https://functions.poehali.dev/04a0a199-dace-420b-bc39-f26061eec035',
};

function getToken(): string {
  return localStorage.getItem('dw_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': getToken(),
  };
}

// AUTH
export async function apiLogin(username: string, password: string) {
  const res = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password }),
  });
  return res.json();
}

export async function apiRegister(username: string, password: string, display_name: string) {
  const res = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', username, password, display_name }),
  });
  return res.json();
}

export async function apiMe() {
  const res = await fetch(URLS.auth + '/me', { headers: authHeaders() });
  return res.json();
}

export async function apiLogout() {
  await fetch(URLS.auth + '/logout', { method: 'POST', headers: authHeaders() });
  localStorage.removeItem('dw_token');
}

// WIKI
export async function apiGetWiki(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  const url = URLS.wiki + (qs.toString() ? '?' + qs.toString() : '');
  const res = await fetch(url, { headers: authHeaders() });
  return res.json();
}

export async function apiCreateArticle(data: Record<string, unknown>) {
  const res = await fetch(URLS.wiki + '/article', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiUpdateArticle(slug: string, data: Record<string, unknown>) {
  const res = await fetch(URLS.wiki + '/article/' + slug, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

// USERS
export async function apiGetUsers() {
  const res = await fetch(URLS.users, { headers: authHeaders() });
  return res.json();
}

export async function apiSetRole(user_id: number, role: string) {
  const res = await fetch(URLS.users + '/set-role', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ user_id, role }),
  });
  return res.json();
}

export async function apiBanUser(user_id: number, reason: string) {
  const res = await fetch(URLS.users + '/ban', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ user_id, reason }),
  });
  return res.json();
}

export async function apiUnbanUser(user_id: number) {
  const res = await fetch(URLS.users + '/unban', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ user_id }),
  });
  return res.json();
}
