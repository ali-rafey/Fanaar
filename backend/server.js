import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  PORT = 4000,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const getUserClient = (token) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '6mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ok = (res, data) => res.json(data ?? {});
const fail = (res, status, message) => res.status(status).json({ error: message });

const failWith = (res, status, error, context) => {
  if (context) console.error(context);
  console.error(error);
  const message = error?.message || String(error);
  return res.status(status).json({
    error: message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
};

const getToken = (req) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  return token || null;
};

const getUserFromToken = async (token) => {
  if (!token) return null;
  const { data, error } = await supabasePublic.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
};

const isAdminUser = async (client, userId) => {
  const { data, error } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) return false;
  return !!data;
};

const requireAdmin = async (req, res, next) => {
  const token = getToken(req);
  const user = await getUserFromToken(token);
  if (!user) return fail(res, 401, 'Unauthorized');
  const adminClient = supabaseAdmin || getUserClient(token);
  const admin = await isAdminUser(adminClient, user.id);
  if (!admin) return fail(res, 403, 'Forbidden');
  req.user = user;
  req.adminClient = adminClient;
  next();
};

app.get('/health', (_, res) => ok(res, { status: 'ok' }));

app.get('/categories', async (_, res) => {
  const { data, error } = await supabasePublic.from('categories').select('*').order('name');
  if (error) return failWith(res, 500, error, 'categories');
  return ok(res, data);
});

app.get('/articles', async (req, res) => {
  const { category, in_stock, limit } = req.query;
  let query = supabasePublic
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', String(category));
  if (in_stock !== undefined) query = query.eq('in_stock', String(in_stock) === 'true');
  if (limit) query = query.limit(Number(limit));

  const { data, error } = await query;
  if (error) return failWith(res, 500, error, 'articles');
  return ok(res, data);
});

app.get('/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabasePublic
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return failWith(res, 500, error, 'article-detail');
  return ok(res, data);
});

app.get('/articles/:id/specs', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabasePublic
    .from('fabric_specs')
    .select('*')
    .eq('article_id', id)
    .maybeSingle();
  if (error) return failWith(res, 500, error, 'article-specs');
  return ok(res, data);
});

app.get('/blogs', async (req, res) => {
  const { limit } = req.query;
  let query = supabasePublic.from('blogs').select('*').order('created_at', { ascending: false });
  if (limit) query = query.limit(Number(limit));
  const { data, error } = await query;
  if (error) return failWith(res, 500, error, 'blogs');
  return ok(res, data);
});

app.get('/blogs/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabasePublic.from('blogs').select('*').eq('id', id).maybeSingle();
  if (error) return failWith(res, 500, error, 'blog-detail');
  return ok(res, data);
});

app.get('/site-settings', async (req, res) => {
  const keysParam = String(req.query.keys || '');
  const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean);
  if (!keys.length) return ok(res, []);
  const { data, error } = await supabasePublic.from('site_settings').select('*').in('key', keys);
  if (error) return failWith(res, 500, error, 'site-settings');
  return ok(res, data);
});

app.post('/auth/sign-in', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 400, 'Email and password required');
  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
  if (error || !data?.session?.access_token || !data?.user) {
    return fail(res, 401, error?.message || 'Invalid credentials');
  }
  const admin = await isAdminUser(supabasePublic, data.user.id);
  if (!admin) return fail(res, 403, 'You do not have admin access');
  return ok(res, { token: data.session.access_token, user: data.user, isAdmin: true });
});

app.post('/auth/sign-up', async (req, res) => {
  const { email, password, redirectTo } = req.body || {};
  if (!email || !password) return fail(res, 400, 'Email and password required');
  const { data, error } = await supabasePublic.auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) return fail(res, 400, error.message);
  return ok(res, { user: data.user, session: data.session });
});

app.post('/auth/sign-out', async (req, res) => ok(res, { status: 'ok' }));

app.get('/auth/me', async (req, res) => {
  const token = getToken(req);
  const user = await getUserFromToken(token);
  if (!user) return fail(res, 401, 'Unauthorized');
  const admin = await isAdminUser(supabasePublic, user.id);
  return ok(res, { user, isAdmin: admin });
});

app.get('/admin/stats', requireAdmin, async (req, res) => {
  const [articles, inStock, categories] = await Promise.all([
    req.adminClient.from('articles').select('id', { count: 'exact', head: true }),
    req.adminClient.from('articles').select('id', { count: 'exact', head: true }).eq('in_stock', true),
    req.adminClient.from('categories').select('id', { count: 'exact', head: true }),
  ]);
  if (articles.error || inStock.error || categories.error) {
    return fail(res, 500, 'Failed to load stats');
  }
  return ok(res, {
    totalArticles: articles.count || 0,
    inStock: inStock.count || 0,
    categories: categories.count || 0,
  });
});

app.post('/admin/categories', requireAdmin, async (req, res) => {
  const { name, image_url } = req.body || {};
  const { error } = await req.adminClient.from('categories').insert({ name, image_url });
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.put('/admin/categories/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, image_url } = req.body || {};
  const { error } = await req.adminClient.from('categories').update({ name, image_url }).eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.delete('/admin/categories/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('categories').delete().eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.post('/admin/articles', requireAdmin, async (req, res) => {
  const { data, error } = await req.adminClient.from('articles').insert(req.body).select().single();
  if (error) return fail(res, 400, error.message);
  return ok(res, data);
});

app.put('/admin/articles/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('articles').update(req.body).eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.patch('/admin/articles/:id/stock', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { in_stock } = req.body || {};
  const { error } = await req.adminClient.from('articles').update({ in_stock }).eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.delete('/admin/articles/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('articles').delete().eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.put('/admin/articles/:id/specs', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data: existing, error: findError } = await req.adminClient
    .from('fabric_specs')
    .select('id')
    .eq('article_id', id)
    .maybeSingle();
  if (findError) return fail(res, 400, findError.message);

  if (existing?.id) {
    const { error } = await req.adminClient.from('fabric_specs').update(req.body).eq('id', existing.id);
    if (error) return fail(res, 400, error.message);
    return ok(res, { status: 'ok', id: existing.id });
  }

  const { data, error } = await req.adminClient
    .from('fabric_specs')
    .insert({ ...req.body, article_id: id })
    .select()
    .single();
  if (error) return fail(res, 400, error.message);
  return ok(res, data);
});

app.get('/admin/specs', requireAdmin, async (req, res) => {
  const { data: specs, error } = await req.adminClient
    .from('fabric_specs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return fail(res, 500, error.message);
  const articleIds = (specs || []).map((s) => s.article_id);
  const { data: articles } = await req.adminClient
    .from('articles')
    .select('id, name')
    .in('id', articleIds);
  const map = new Map((articles || []).map((a) => [a.id, a]));
  const merged = (specs || []).map((spec) => ({ ...spec, article: map.get(spec.article_id) }));
  return ok(res, merged);
});

app.put('/admin/specs/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('fabric_specs').update(req.body).eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.post('/admin/blogs', requireAdmin, async (req, res) => {
  const { error } = await req.adminClient.from('blogs').insert(req.body);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.put('/admin/blogs/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('blogs').update(req.body).eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.delete('/admin/blogs/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await req.adminClient.from('blogs').delete().eq('id', id);
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.put('/admin/site-settings/:key', requireAdmin, async (req, res) => {
  const { key } = req.params;
  const { value, media_type } = req.body || {};
  const { data: existing, error: findError } = await req.adminClient
    .from('site_settings')
    .select('id')
    .eq('key', key)
    .maybeSingle();
  if (findError) return fail(res, 400, findError.message);

  if (existing) {
    const { error } = await req.adminClient
      .from('site_settings')
      .update({ value, media_type: media_type ?? undefined })
      .eq('key', key);
    if (error) return fail(res, 400, error.message);
    return ok(res, { status: 'ok' });
  }

  const { error } = await req.adminClient.from('site_settings').insert({ key, value, media_type });
  if (error) return fail(res, 400, error.message);
  return ok(res, { status: 'ok' });
});

app.post('/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
  const file = req.file;
  const { path } = req.body || {};
  if (!file) return fail(res, 400, 'Missing file');
  if (!path) return fail(res, 400, 'Missing path');

  const { error } = await req.adminClient.storage
    .from('fabric-images')
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) return fail(res, 400, error.message);

  const { data } = req.adminClient.storage.from('fabric-images').getPublicUrl(path);
  return ok(res, { publicUrl: data.publicUrl });
});

if (!process.env.VERCEL) {
  app.listen(Number(PORT), () => {
    console.log(`Backend listening on :${PORT}`);
  });
}

export default app;
