import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type Resource = 'pages' | 'posts' | 'media' | 'settings' | 'logs';

const PAGE_MUTABLE_FIELDS = [
  'slug',
  'title',
  'excerpt',
  'content',
  'status',
  'hero_image_url',
  'meta_title',
  'meta_description',
  'published_at',
  'author_id',
  'editor_id',
] as const;

const POST_MUTABLE_FIELDS = [
  'slug',
  'title',
  'excerpt',
  'content',
  'status',
  'cover_image_url',
  'tags',
  'published_at',
  'author_id',
  'editor_id',
] as const;

const MEDIA_MUTABLE_FIELDS = ['bucket', 'path', 'mime_type', 'size_bytes', 'alt_text', 'metadata'] as const;

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase env vars inside admin-content function');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return jsonResponse({ success: false, error: 'Authorization header required' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return jsonResponse({ success: false, error: 'Invalid token' }, 401);
    }

    const isAdmin = (authData.user.app_metadata?.role ?? '') === 'admin';
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden' }, 403);
    }

    const adminId = authData.user.id;
    const url = new URL(req.url);
    const resource = (url.searchParams.get('resource') ?? 'pages') as Resource;
    const idParam = url.searchParams.get('id');

    switch (resource) {
      case 'pages':
        return await handlePages(req, supabase, adminId, idParam);
      case 'posts':
        return await handlePosts(req, supabase, adminId, idParam);
      case 'media':
        return await handleMedia(req, supabase, adminId, idParam);
      case 'settings':
        return await handleSettings(req, supabase, adminId);
      case 'logs':
        return await handleLogs(req, supabase);
      default:
        return jsonResponse({ success: false, error: 'Unknown resource' }, 400);
    }
  } catch (error) {
    console.error('[admin-content] error', error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

async function handlePages(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  id?: string | null,
) {
  const method = req.method.toUpperCase();
  const url = new URL(req.url);

  if (method === 'GET') {
    if (id) {
      const { data, error } = await supabase.from('pages').select('*').eq('id', id).maybeSingle();
      if (error) return jsonResponse({ success: false, error: error.message }, 400);
      return jsonResponse({ success: true, data });
    }

    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let query = supabase.from('pages').select('*').order('updated_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true, data });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return jsonResponse({ success: false, error: 'Invalid body' }, 400);
  }
  if (!body.slug || !body.title) {
    return jsonResponse({ success: false, error: 'slug ve title alanları zorunlu' }, 400);
  }

  const payload = normalizeContentBody(body, PAGE_MUTABLE_FIELDS, 'draft');

  if (method === 'POST') {
    payload.author_id = payload.author_id ?? adminId;
    const { data, error } = await supabase.from('pages').insert(payload).select().single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'create_page', 'page', data.id, body);
    return jsonResponse({ success: true, data });
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    payload.editor_id = adminId;
    const { data, error } = await supabase.from('pages').update(payload).eq('id', id).select().single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'update_page', 'page', id, body);
    return jsonResponse({ success: true, data });
  }

  if (method === 'DELETE') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'delete_page', 'page', id, null);
    return jsonResponse({ success: true });
  }

  return methodNotAllowed();
}

async function handlePosts(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  id?: string | null,
) {
  const method = req.method.toUpperCase();
  const url = new URL(req.url);

  if (method === 'GET') {
    if (id) {
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (error) return jsonResponse({ success: false, error: error.message }, 400);
      return jsonResponse({ success: true, data });
    }

    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    let query = supabase.from('posts').select('*').order('updated_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true, data });
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonResponse({ success: false, error: 'Invalid body' }, 400);
  if (!body.slug || !body.title) {
    return jsonResponse({ success: false, error: 'slug ve title alanları zorunlu' }, 400);
  }

  const payload = normalizeContentBody(body, POST_MUTABLE_FIELDS, 'draft');

  if (method === 'POST') {
    payload.author_id = payload.author_id ?? adminId;
    const { data, error } = await supabase.from('posts').insert(payload).select().single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'create_post', 'post', data.id, body);
    return jsonResponse({ success: true, data });
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    payload.editor_id = adminId;
    const { data, error } = await supabase.from('posts').update(payload).eq('id', id).select().single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'update_post', 'post', id, body);
    return jsonResponse({ success: true, data });
  }

  if (method === 'DELETE') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'delete_post', 'post', id, null);
    return jsonResponse({ success: true });
  }

  return methodNotAllowed();
}

async function handleMedia(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  id?: string | null,
) {
  const method = req.method.toUpperCase();
  const url = new URL(req.url);

  if (method === 'GET') {
    if (id) {
      const { data, error } = await supabase.from('media_assets').select('*').eq('id', id).maybeSingle();
      if (error) return jsonResponse({ success: false, error: error.message }, 400);
      return jsonResponse({ success: true, data });
    }

    const bucket = url.searchParams.get('bucket');
    let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    if (bucket) query = query.eq('bucket', bucket);
    const { data, error } = await query;
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true, data });
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonResponse({ success: false, error: 'Invalid body' }, 400);

  const payload = normalizeMediaBody(body, method === 'POST');
  if (!payload) {
    return jsonResponse({ success: false, error: 'path alanı zorunlu' }, 400);
  }

  if (method === 'POST') {
    const insertPayload = { ...payload, uploaded_by: adminId };
    const { data, error } = await supabase.from('media_assets').insert(insertPayload).select().single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'create_media', 'media', data.id, payload);
    return jsonResponse({ success: true, data });
  }

  if (method === 'PATCH') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    const { data, error } = await supabase
      .from('media_assets')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'update_media', 'media', id, body);
    return jsonResponse({ success: true, data });
  }

  if (method === 'DELETE') {
    if (!id) return jsonResponse({ success: false, error: 'id param required' }, 400);
    const { error } = await supabase.from('media_assets').delete().eq('id', id);
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'delete_media', 'media', id, null);
    return jsonResponse({ success: true });
  }

  return methodNotAllowed();
}

async function handleSettings(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  adminId: string,
) {
  const method = req.method.toUpperCase();
  if (method === 'GET') {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    return jsonResponse({ success: true, data });
  }

  if (method === 'PATCH' || method === 'POST') {
    const body = await req.json().catch(() => null);
    if (!body || !body.key) return jsonResponse({ success: false, error: 'key & value required' }, 400);

    const value = typeof body.value === 'object' && body.value !== null ? body.value : {};
    const isPublic = typeof body.is_public === 'boolean' ? body.is_public : true;

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        key: body.key,
        value,
        is_public: isPublic,
        updated_by: adminId,
      })
      .select()
      .single();

    if (error) return jsonResponse({ success: false, error: error.message }, 400);
    await logActivity(supabase, adminId, 'update_setting', 'settings', body.key, body.payload);
    return jsonResponse({ success: true, data });
  }

  return methodNotAllowed();
}

async function handleLogs(req: Request, supabase: ReturnType<typeof createClient>) {
  if (req.method !== 'GET') return methodNotAllowed();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 50);

  const { data, error } = await supabase
    .from('admin_activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 200));

  if (error) return jsonResponse({ success: false, error: error.message }, 400);
  return jsonResponse({ success: true, data });
}

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, any> | null,
) {
  await supabase.from('admin_activity_logs').insert({
    actor_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityType === 'settings' ? null : entityId,
    metadata: payload ?? {},
  });
}

function jsonResponse(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function methodNotAllowed() {
  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}

function normalizeContentBody(body: Record<string, any>, allowedFields: readonly string[], defaultStatus: string) {
  const sanitized = pickAllowed(body, allowedFields);
  sanitized.status = typeof sanitized.status === 'string' ? sanitized.status : defaultStatus;
  sanitized.content =
    typeof sanitized.content === 'object' && sanitized.content !== null ? sanitized.content : {};

  if (allowedFields.includes('tags')) {
    sanitized.tags =
      Array.isArray(sanitized.tags) && sanitized.tags.every((t: unknown) => typeof t === 'string')
        ? sanitized.tags
        : [];
  }

  return sanitized;
}

function normalizeMediaBody(body: Record<string, any>, requirePath: boolean) {
  const sanitized = pickAllowed(body, MEDIA_MUTABLE_FIELDS);
  sanitized.bucket = typeof sanitized.bucket === 'string' && sanitized.bucket.length > 0 ? sanitized.bucket : 'public';
  if (requirePath && !sanitized.path) {
    return null;
  }
  sanitized.metadata =
    typeof sanitized.metadata === 'object' && sanitized.metadata !== null ? sanitized.metadata : {};
  return sanitized;
}

function pickAllowed(body: Record<string, any>, allowed: readonly string[]) {
  const result: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) {
      result[key] = body[key];
    }
  }
  return result;
}

