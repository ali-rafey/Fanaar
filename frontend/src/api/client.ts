import type { Category, FabricArticle, FabricSpecs } from '@/types/fabric';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type ApiOptions<TBody = unknown> = Omit<RequestInit, 'body'> & { body?: TBody };

type ApiError = Error & {
  status?: number;
  code?: string;
  details?: unknown;
  hint?: string;
};

type ApiErrorResponse = {
  error?: string;
  code?: string;
  details?: unknown;
  hint?: string;
};

type AdminUser = {
  id: string;
  email?: string | null;
};

export interface SiteSettingRecord {
  id?: string;
  key: string;
  value: string | null;
  media_type: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessSectionEntry {
  image?: string;
}

export interface BlogSummary {
  id: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  image_url: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BlogDetail extends BlogSummary {
  content: string | null;
}

export interface HomeResponse {
  categories: Category[];
  blogs: BlogSummary[];
  hero_media: SiteSettingRecord | null;
  hero_video_url: string | null;
  hero_image_url: string | null;
  hero_video_focus_x: string | null;
  hero_video_focus_y: string | null;
  process_section: ProcessSectionEntry[];
}

export interface AdminStats {
  totalArticles: number;
  inStock: number;
  categories: number;
}

export interface AuthSessionResponse {
  token: string;
  user: AdminUser;
  isAdmin: boolean;
}

export interface UploadResponse {
  publicUrl: string;
}

export interface AdminSpecRecord extends FabricSpecs {
  article?: { id: string; name: string } | null;
}

export interface CategoryPayload {
  name: string;
  image_url: string | null;
}

export interface ArticlePayload {
  name: string;
  description: string | null;
  category: string;
  price_aed: number;
  price_usd: number | null;
  price_pkr: number | null;
  hero_image_url: string | null;
  in_stock: boolean;
}

export interface ArticleSpecsPayload {
  gsm: number;
  tear_strength: string;
  tensile_strength: string;
  dye_class: string;
  thread_count: string;
}

export interface BlogPayload {
  title: string;
  excerpt: string | null;
  content: string | null;
  tag: string | null;
  image_url: string | null;
}

interface ListParams {
  limit?: number;
  offset?: number;
}

interface ArticleListParams extends ListParams {
  category?: string;
  in_stock?: boolean;
}

const createApiError = (
  message: string,
  status?: number,
  payload?: ApiErrorResponse | null,
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = payload?.code;
  error.details = payload?.details;
  error.hint = payload?.hint;
  return error;
};

const isApiError = (value: unknown): value is ApiError => value instanceof Error;

const readJsonSafely = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const parseProcessSection = (value: string | null | undefined): ProcessSectionEntry[] => {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as ProcessSectionEntry[];
  } catch {
    return [];
  }
};

const createQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('admin_token');
};

export const setAuthToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem('admin_token', token);
    return;
  }

  window.localStorage.removeItem('admin_token');
};

const request = async <TResponse, TBody = unknown>(
  path: string,
  options: ApiOptions<TBody> = {},
): Promise<TResponse> => {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!res.ok) {
    const payload = await readJsonSafely<ApiErrorResponse>(res);
    const message = payload?.error ?? `Request failed (${res.status})`;
    throw createApiError(message, res.status, payload);
  }

  if (res.status === 204) {
    return null as TResponse;
  }

  const data = await readJsonSafely<TResponse>(res);
  if (data === null) {
    throw createApiError('Response body was empty', res.status);
  }

  return data;
};

let refreshInFlight: Promise<string> | null = null;

const runTokenRefresh = async (): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    setAuthToken(null);
    throw createApiError('Not authenticated', res.status);
  }

  const data = await readJsonSafely<AuthSessionResponse>(res);
  if (!data?.token) {
    setAuthToken(null);
    throw createApiError('Not authenticated', res.status);
  }

  setAuthToken(data.token);
  return data.token;
};

const refreshAuthToken = async (): Promise<string> => {
  if (!refreshInFlight) {
    refreshInFlight = runTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

const getValidAuthToken = async (): Promise<string> => {
  const existingToken = getAuthToken();
  if (existingToken) {
    return existingToken;
  }

  return refreshAuthToken();
};

const authRequest = async <TResponse, TBody = unknown>(
  path: string,
  options: ApiOptions<TBody> = {},
): Promise<TResponse> => {
  let token: string;

  try {
    token = await getValidAuthToken();
  } catch {
    throw createApiError('Not authenticated', 401);
  }

  const makeHeaders = (accessToken: string) => ({
    ...(options.headers as HeadersInit | undefined),
    Authorization: `Bearer ${accessToken}`,
  });

  try {
    return await request<TResponse, TBody>(path, {
      ...options,
      headers: makeHeaders(token),
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      setAuthToken(null);
      const refreshedToken = await refreshAuthToken();
      return request<TResponse, TBody>(path, {
        ...options,
        headers: makeHeaders(refreshedToken),
      });
    }

    throw error;
  }
};

export const api = {
  home: {
    load: async (): Promise<HomeResponse> => {
      try {
        return await request<HomeResponse>('/home');
      } catch (error) {
        if (!isApiError(error) || (error.status !== 404 && error.status !== 500)) {
          throw error;
        }

        const [categories, blogs, settings] = await Promise.all([
          request<Category[]>('/categories'),
          request<BlogSummary[]>('/blogs?limit=4'),
          request<SiteSettingRecord[]>(
            '/site-settings?keys=hero_media,hero_video_url,hero_image_url,hero_video_focus_x,hero_video_focus_y,process_section',
          ),
        ]);

        const settingsMap = new Map(settings.map((entry) => [entry.key, entry]));

        return {
          categories,
          blogs,
          hero_media: settingsMap.get('hero_media') ?? null,
          hero_video_url: settingsMap.get('hero_video_url')?.value ?? null,
          hero_image_url: settingsMap.get('hero_image_url')?.value ?? null,
          hero_video_focus_x: settingsMap.get('hero_video_focus_x')?.value ?? null,
          hero_video_focus_y: settingsMap.get('hero_video_focus_y')?.value ?? null,
          process_section: parseProcessSection(settingsMap.get('process_section')?.value),
        };
      }
    },
  },
  categories: {
    list: (): Promise<Category[]> => request<Category[]>('/categories'),
    create: (payload: CategoryPayload): Promise<{ status: string }> =>
      authRequest('/admin/categories', { method: 'POST', body: payload }),
    update: (id: string, payload: CategoryPayload): Promise<{ status: string }> =>
      authRequest(`/admin/categories/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string): Promise<{ status: string }> =>
      authRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
  articles: {
    list: (params?: ArticleListParams): Promise<FabricArticle[]> =>
      request<FabricArticle[]>(
        `/articles${createQueryString({
          category: params?.category,
          in_stock: params?.in_stock,
          limit: params?.limit,
          offset: params?.offset,
        })}`,
      ),
    get: (id: string): Promise<FabricArticle | null> =>
      request<FabricArticle | null>(`/articles/${id}`),
    getSpecs: (articleId: string): Promise<FabricSpecs | null> =>
      request<FabricSpecs | null>(`/articles/${articleId}/specs`),
    create: (payload: ArticlePayload): Promise<FabricArticle> =>
      authRequest('/admin/articles', { method: 'POST', body: payload }),
    update: (id: string, payload: ArticlePayload): Promise<{ status: string }> =>
      authRequest(`/admin/articles/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string): Promise<{ status: string }> =>
      authRequest(`/admin/articles/${id}`, { method: 'DELETE' }),
    toggleStock: (id: string, in_stock: boolean): Promise<{ status: string }> =>
      authRequest(`/admin/articles/${id}/stock`, { method: 'PATCH', body: { in_stock } }),
    upsertSpecs: (articleId: string, payload: ArticleSpecsPayload): Promise<FabricSpecs> =>
      authRequest(`/admin/articles/${articleId}/specs`, { method: 'PUT', body: payload }),
  },
  blogs: {
    list: (params?: ListParams): Promise<BlogSummary[]> =>
      request<BlogSummary[]>(
        `/blogs${createQueryString({
          limit: params?.limit,
          offset: params?.offset,
        })}`,
      ),
    get: (id: string): Promise<BlogDetail | null> =>
      request<BlogDetail | null>(`/blogs/${id}`),
    create: (payload: BlogPayload): Promise<{ status: string }> =>
      authRequest('/admin/blogs', { method: 'POST', body: payload }),
    update: (id: string, payload: BlogPayload): Promise<{ status: string }> =>
      authRequest(`/admin/blogs/${id}`, { method: 'PUT', body: payload }),
    remove: (id: string): Promise<{ status: string }> =>
      authRequest(`/admin/blogs/${id}`, { method: 'DELETE' }),
  },
  settings: {
    list: (keys: string[]): Promise<SiteSettingRecord[]> =>
      request<SiteSettingRecord[]>(`/site-settings?keys=${encodeURIComponent(keys.join(','))}`),
    upsert: (
      key: string,
      payload: { value: string | null; media_type?: string | null },
    ): Promise<{ status: string }> =>
      authRequest(`/admin/site-settings/${key}`, { method: 'PUT', body: payload }),
  },
  admin: {
    stats: (): Promise<AdminStats> => authRequest('/admin/stats'),
    specs: (): Promise<AdminSpecRecord[]> => authRequest('/admin/specs'),
    updateSpec: (
      id: string,
      payload: ArticleSpecsPayload,
    ): Promise<{ status: string }> => authRequest(`/admin/specs/${id}`, { method: 'PUT', body: payload }),
    upload: async (file: File, path: string): Promise<UploadResponse> => {
      let token: string;

      try {
        token = await getValidAuthToken();
      } catch {
        throw createApiError('Not authenticated', 401);
      }

      const form = new FormData();
      form.append('file', file);
      form.append('path', path);

      const doUpload = async (accessToken: string): Promise<Response> =>
        fetch(`${API_BASE_URL}/admin/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });

      let res = await doUpload(token);

      if (res.status === 401) {
        setAuthToken(null);
        token = await refreshAuthToken();
        res = await doUpload(token);
      }

      if (!res.ok) {
        const payload = await readJsonSafely<ApiErrorResponse>(res);
        const message = payload?.error ?? `Upload failed (${res.status})`;
        throw createApiError(message, res.status, payload);
      }

      const data = await readJsonSafely<UploadResponse>(res);
      if (!data) {
        throw createApiError('Upload response was empty', res.status);
      }

      return data;
    },
    signIn: (email: string, password: string): Promise<AuthSessionResponse> =>
      request('/auth/sign-in', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      }),
    signUp: (
      email: string,
      password: string,
      redirectTo?: string,
    ): Promise<{ user: AdminUser | null; session: unknown }> =>
      request('/auth/sign-up', { method: 'POST', body: { email, password, redirectTo } }),
    signOut: (): Promise<{ status: string }> =>
      request('/auth/sign-out', { method: 'POST', credentials: 'include' }),
    me: (): Promise<{ user: AdminUser; isAdmin: boolean }> => authRequest('/auth/me'),
  },
};
