const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };
type ApiError = Error & { status?: number };

type SiteSettingRecord = {
  key: string;
  value: string | null;
  media_type?: string | null;
};

export const getAuthToken = () => {
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
    const err = new Error(message) as ApiError;
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
    const err = new Error('Not authenticated') as ApiError;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!data?.token) throw new Error('Not authenticated');
  setAuthToken(data.token);
  return data.token as string;
};

const getValidAuthToken = async () => {
  const existingToken = getAuthToken();
  if (existingToken) return existingToken;
  return refreshAuthToken();
};

const authRequest = async (path: string, options: ApiOptions = {}) => {
  let token: string;
  try {
    token = await getValidAuthToken();
  } catch (_) {
    throw new Error('Not authenticated');
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
  home: {
    load: async () => {
      try {
        return await request('/home');
      } catch (error) {
        const err = error as ApiError;
        if (err.status && err.status !== 404 && err.status !== 500) {
          throw err;
        }

        const [categories, blogs, settings] = await Promise.all([
          request('/categories'),
          request('/blogs?limit=4'),
          request('/site-settings?keys=hero_media,hero_video_url,hero_image_url,hero_video_focus_x,hero_video_focus_y,process_section'),
        ]);

        const settingsMap = new Map(
          ((settings as SiteSettingRecord[] | null) || []).map((entry) => [entry.key, entry])
        );

        let processSection: Array<{ image?: string }> = [];
        try {
          processSection = JSON.parse(settingsMap.get('process_section')?.value || '[]');
        } catch (_) {
          processSection = [];
        }

        return {
          categories,
          blogs,
          hero_media: settingsMap.get('hero_media') || null,
          hero_video_url: settingsMap.get('hero_video_url')?.value || null,
          hero_image_url: settingsMap.get('hero_image_url')?.value || null,
          hero_video_focus_x: settingsMap.get('hero_video_focus_x')?.value || null,
          hero_video_focus_y: settingsMap.get('hero_video_focus_y')?.value || null,
          process_section: processSection,
        };
      }
    },
  },
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
      let token: string;
      try {
        token = await getValidAuthToken();
      } catch (_) {
        throw new Error('Not authenticated');
      }
      const form = new FormData();
      form.append('file', file);
      form.append('path', path);
      const doUpload = async (accessToken: string) =>
        fetch(`${API_BASE_URL}/admin/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });

      let res = await doUpload(token);
      if (res.status === 401) {
        token = await refreshAuthToken();
        res = await doUpload(token);
      }
      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch (_) {}
        const err = new Error(message) as ApiError;
        err.status = res.status;
        throw err;
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
