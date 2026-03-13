const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('admin_token');
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('admin_token', token);
  else window.localStorage.removeItem('admin_token');
};

const request = async (path: string, options: ApiOptions = {}) => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined = undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch (_) {}
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
};

const refreshAuthToken = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = new Error('Not authenticated') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!data?.token) throw new Error('Not authenticated');
  setAuthToken(data.token);
  return data.token as string;
};

const authRequest = async (path: string, options: ApiOptions = {}) => {
  let token = getAuthToken();
  if (!token) {
    try {
      token = await refreshAuthToken();
    } catch (_) {
      throw new Error('Not authenticated');
    }
  }
  const headers = {
    ...(options.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };
  try {
    return await request(path, { ...options, headers });
  } catch (err: any) {
    if (err?.status === 401) {
      try {
        token = await refreshAuthToken();
        const retryHeaders = {
          ...(options.headers as Record<string, string> | undefined),
          Authorization: `Bearer ${token}`,
        };
        return await request(path, { ...options, headers: retryHeaders });
      } catch (_) {}
    }
    throw err;
  }
};

export const api = {
  categories: {
    list: () => request('/categories'),
    create: (payload: { name: string; image_url: string | null }) =>
      authRequest('/admin/categories', { method: 'POST', body: payload }),
    update: (id: string, payload: { name: string; image_url: string | null }) =>
      authRequest(`/admin/categories/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string) => authRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
  articles: {
    list: (params?: { category?: string; in_stock?: boolean; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.category) search.set('category', params.category);
      if (params?.in_stock !== undefined) search.set('in_stock', String(params.in_stock));
      if (params?.limit) search.set('limit', String(params.limit));
      const suffix = search.toString() ? `?${search.toString()}` : '';
      return request(`/articles${suffix}`);
    },
    get: (id: string) => request(`/articles/${id}`),
    getSpecs: (articleId: string) => request(`/articles/${articleId}/specs`),
    create: (payload: Record<string, unknown>) =>
      authRequest('/admin/articles', { method: 'POST', body: payload }),
    update: (id: string, payload: Record<string, unknown>) =>
      authRequest(`/admin/articles/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string) => authRequest(`/admin/articles/${id}`, { method: 'DELETE' }),
    toggleStock: (id: string, in_stock: boolean) =>
      authRequest(`/admin/articles/${id}/stock`, { method: 'PATCH', body: { in_stock } }),
    upsertSpecs: (articleId: string, payload: Record<string, unknown>) =>
      authRequest(`/admin/articles/${articleId}/specs`, { method: 'PUT', body: payload }),
  },
  blogs: {
    list: (params?: { limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', String(params.limit));
      const suffix = search.toString() ? `?${search.toString()}` : '';
      return request(`/blogs${suffix}`);
    },
    get: (id: string) => request(`/blogs/${id}`),
    create: (payload: Record<string, unknown>) =>
      authRequest('/admin/blogs', { method: 'POST', body: payload }),
    update: (id: string, payload: Record<string, unknown>) =>
      authRequest(`/admin/blogs/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string) => authRequest(`/admin/blogs/${id}`, { method: 'DELETE' }),
  },
  settings: {
    list: (keys: string[]) => {
      const search = new URLSearchParams();
      search.set('keys', keys.join(','));
      return request(`/site-settings?${search.toString()}`);
    },
    upsert: (key: string, payload: { value: string | null; media_type?: string | null }) =>
      authRequest(`/admin/site-settings/${key}`, { method: 'PUT', body: payload }),
  },
  admin: {
    stats: () => authRequest('/admin/stats'),
    specs: () => authRequest('/admin/specs'),
    updateSpec: (id: string, payload: Record<string, unknown>) =>
      authRequest(`/admin/specs/${id}`, { method: 'PUT', body: payload }),
    upload: async (file: File, path: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const form = new FormData();
      form.append('file', file);
      form.append('path', path);
      const res = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch (_) {}
        throw new Error(message);
      }
      return res.json();
    },
    signIn: (email: string, password: string) =>
      request('/auth/sign-in', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      }),
    signUp: (email: string, password: string, redirectTo?: string) =>
      request('/auth/sign-up', { method: 'POST', body: { email, password, redirectTo } }),
    signOut: () =>
      request('/auth/sign-out', { method: 'POST', credentials: 'include' }),
    me: () => authRequest('/auth/me'),
  },
};
