import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivitySquare,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';

type Resource = 'pages' | 'posts' | 'media' | 'settings' | 'logs';
type PageRow = Database['public']['Tables']['pages']['Row'];
type PostRow = Database['public']['Tables']['posts']['Row'];
type MediaRow = Database['public']['Tables']['media_assets']['Row'];
type SettingRow = Database['public']['Tables']['site_settings']['Row'];
type ActivityRow = Database['public']['Tables']['admin_activity_logs']['Row'];

type ResourceRecord = PageRow | PostRow | MediaRow | SettingRow | ActivityRow;

type FormField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'json' | 'datetime';
  placeholder?: string;
  required?: boolean;
  helper?: string;
  rows?: number;
  options?: Array<{ label: string; value: string }>;
};

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RESOURCE_CONFIG: Record<
  Resource,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    fields?: FormField[];
    columns: Array<{ key: string; label: string; render?: (value: any, item: ResourceRecord) => string }>;
  }
> = {
  pages: {
    label: 'Sayfa İçeriği',
    description: 'Statik sayfalar, SEO içerikleri ve kampanya iniş sayfaları',
    icon: LayoutDashboard,
    gradient: 'from-sky-500/90 to-cyan-500/70',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text', placeholder: 'Örn. Ana Sayfa', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'ornekslug', required: true },
      { key: 'status', label: 'Durum', type: 'select', options: selectOptions(['draft', 'review', 'scheduled', 'published', 'archived']) },
      { key: 'published_at', label: 'Yayın Tarihi', type: 'datetime' },
      { key: 'hero_image_url', label: 'Hero Görsel URL', type: 'text', placeholder: 'https://...' },
      { key: 'meta_title', label: 'Meta Title', type: 'text' },
      { key: 'meta_description', label: 'Meta Description', type: 'textarea', rows: 3 },
      {
        key: 'content',
        label: 'İçerik JSON',
        type: 'json',
        rows: 6,
        helper: 'Blok tabanlı içerik yapısını JSON olarak girin',
      },
    ],
    columns: [
      { key: 'title', label: 'Başlık' },
      { key: 'slug', label: 'Slug' },
      { key: 'status', label: 'Durum', render: value => value?.toUpperCase?.() ?? value },
      { key: 'updated_at', label: 'Güncellendi', render: value => formatRelative(value) },
    ],
  },
  posts: {
    label: 'Blog / Duyuru',
    description: 'Blog yazıları, haberler ve duyurular',
    icon: FileText,
    gradient: 'from-indigo-500/90 to-blue-500/80',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', placeholder: 'seo-analiz-nasil-yapilir', required: true },
      { key: 'status', label: 'Durum', type: 'select', options: selectOptions(['draft', 'review', 'scheduled', 'published', 'archived']) },
      { key: 'published_at', label: 'Yayın Tarihi', type: 'datetime' },
      { key: 'cover_image_url', label: 'Kapak Görseli', type: 'text', placeholder: 'https://...' },
      { key: 'excerpt', label: 'Özet', type: 'textarea', rows: 3 },
      {
        key: 'tags',
        label: 'Etiketler',
        type: 'text',
        placeholder: 'seo,performans,teknik',
        helper: 'Virgülle ayırın',
      },
      {
        key: 'content',
        label: 'İçerik JSON',
        type: 'json',
        rows: 6,
        helper: 'Rich text içeriği JSON formatında saklanır',
      },
    ],
    columns: [
      { key: 'title', label: 'Başlık' },
      { key: 'status', label: 'Durum', render: value => value?.toUpperCase?.() ?? value },
      { key: 'tags', label: 'Etiketler', render: value => (Array.isArray(value) ? value.slice(0, 3).join(', ') : '-') },
      { key: 'updated_at', label: 'Güncellendi', render: value => formatRelative(value) },
    ],
  },
  media: {
    label: 'Medya Varlıkları',
    description: 'Supabase Storage ile bağlı görseller ve dosyalar',
    icon: ImageIcon,
    gradient: 'from-emerald-500/80 to-teal-500/70',
    fields: [
      { key: 'path', label: 'Dosya Yolu', type: 'text', placeholder: 'hero/home-1.webp', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', placeholder: 'public' },
      { key: 'mime_type', label: 'Mime Type', type: 'text', placeholder: 'image/webp' },
      { key: 'size_bytes', label: 'Boyut (byte)', type: 'text', placeholder: '123456' },
      { key: 'alt_text', label: 'Alt Metin', type: 'textarea', rows: 2 },
      {
        key: 'metadata',
        label: 'Metadata JSON',
        type: 'json',
        rows: 4,
        helper: 'Responsive varyantlar vb. ek bilgileri tutar',
      },
    ],
    columns: [
      { key: 'path', label: 'Dosya' },
      { key: 'bucket', label: 'Bucket' },
      { key: 'mime_type', label: 'Tip' },
      {
        key: 'size_bytes',
        label: 'Boyut',
        render: value => (value ? formatBytes(Number(value)) : '-'),
      },
      { key: 'created_at', label: 'Yüklendi', render: value => formatRelative(value) },
    ],
  },
  settings: {
    label: 'Site Ayarları',
    description: 'Global içerik blokları, iletişim bilgileri, banner bildirileri',
    icon: SettingsIcon,
    gradient: 'from-amber-500/80 to-orange-500/70',
    fields: [
      { key: 'key', label: 'Ayar Anahtarı', type: 'text', placeholder: 'hero', required: true },
      {
        key: 'value',
        label: 'JSON İçerik',
        type: 'json',
        rows: 6,
        helper: 'Her ayar için key/value JSON yapısı',
      },
      {
        key: 'is_public',
        label: 'Frontend ile paylaş',
        type: 'select',
        options: [
          { label: 'Evet (public)', value: 'true' },
          { label: 'Hayır (sadece admin)', value: 'false' },
        ],
      },
    ],
    columns: [
      { key: 'key', label: 'Anahtar' },
      {
        key: 'is_public',
        label: 'Durum',
        render: value => (value ? 'Public' : 'Private'),
      },
      { key: 'updated_at', label: 'Güncellendi', render: value => formatRelative(value) },
    ],
  },
  logs: {
    label: 'Aktivite Günlüğü',
    description: 'Tüm admin işlemleri ve Supabase fonksiyon kayıtları',
    icon: ActivitySquare,
    gradient: 'from-fuchsia-500/80 to-purple-500/70',
    columns: [
      { key: 'action', label: 'Aksiyon' },
      { key: 'entity_type', label: 'Varlık' },
      { key: 'actor_id', label: 'Admin' },
      { key: 'created_at', label: 'Tarih', render: value => formatRelative(value) },
    ],
  },
};

const JSON_FIELDS: Record<Resource, string[]> = {
  pages: ['content'],
  posts: ['content'],
  media: ['metadata'],
  settings: ['value'],
  logs: [],
};

const ARRAY_FIELDS: Record<Resource, string[]> = {
  pages: [],
  posts: ['tags'],
  media: [],
  settings: [],
  logs: [],
};

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const [activeResource, setActiveResource] = useState<Resource>('pages');
  const [items, setItems] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<ResourceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResource, isOpen]);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      const data = await callAdminApi<ResourceRecord[]>({
        resource: activeResource,
      });
      setItems(data ?? []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Kayıtlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [activeResource]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, searchTerm]);

  const stats = useMemo(() => buildStats(activeResource, items), [activeResource, items]);

  const openEditor = (mode: 'create' | 'edit', item?: ResourceRecord) => {
    setEditorMode(mode);
    setSelectedItem(item ?? null);
    const fields = RESOURCE_CONFIG[activeResource].fields ?? [];
    const initialValues: Record<string, string> = {};

    fields.forEach(field => {
      const rawValue = (item as Record<string, any> | undefined)?.[field.key];
      if (JSON_FIELDS[activeResource].includes(field.key)) {
        initialValues[field.key] = JSON.stringify(rawValue ?? {}, null, 2);
      } else if (ARRAY_FIELDS[activeResource].includes(field.key) && Array.isArray(rawValue)) {
        initialValues[field.key] = rawValue.join(', ');
      } else if (field.type === 'datetime' && rawValue) {
        initialValues[field.key] = rawValue.slice(0, 16);
      } else if (typeof rawValue === 'boolean') {
        initialValues[field.key] = rawValue ? 'true' : 'false';
      } else {
        initialValues[field.key] = rawValue?.toString?.() ?? '';
      }
    });

    setFormValues(initialValues);
    setEditorOpen(true);
  };

  const handleDelete = async (item: ResourceRecord) => {
    if (!confirm('Seçili kaydı silmek istediğinize emin misiniz?')) return;
    try {
      setSaving(true);
      await callAdminApi({
        resource: activeResource,
        method: 'DELETE',
        id: getPrimaryId(item),
      });
      await loadItems();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Kayıt silinemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = preparePayload(activeResource, formValues);
    const method = editorMode === 'create' ? 'POST' : 'PATCH';
    try {
      setSaving(true);
      await callAdminApi({
        resource: activeResource,
        method,
        id: editorMode === 'edit' ? getPrimaryId(selectedItem) : undefined,
        body: payload,
      });
      setEditorOpen(false);
      await loadItems();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Kayıt kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const { icon: ActiveIcon, label, description, gradient, columns, fields } = RESOURCE_CONFIG[activeResource];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/90 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_50%)]" />
      <div className="relative flex h-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-white/10 bg-slate-950/40 flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
              <div>
                <p className="text-sm text-blue-200/80">NeoKreatif Admin</p>
                <p className="font-semibold text-white">İçerik Stüdyosu</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {Object.entries(RESOURCE_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveResource(key as Resource)}
                className={`group flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium transition ${
                  activeResource === key
                    ? 'text-white bg-white/10 shadow-lg shadow-blue-900/30'
                    : 'text-blue-100/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <config.icon className="w-4 h-4" />
                <span>{config.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-white/5 text-xs text-blue-200/70 space-y-1">
            <p>Supabase Projects</p>
            <p>cchgusotdmiabshxjjof</p>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col h-full">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-200/70">NeoKreatif • CMS Kontrol</p>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <ActiveIcon className="w-6 h-6 text-blue-200" />
                {label}
              </h1>
              <p className="text-sm text-blue-100/80">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="hidden md:inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                onClick={() => loadItems()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
              <button
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden px-6 pb-8 pt-6">
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {stats.map(stat => (
                <div
                  key={stat.title}
                  className={`rounded-2xl bg-gradient-to-br ${gradient} text-white/95 border border-white/10 shadow-xl backdrop-blur`}
                >
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-white/70">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-white/70 mt-1">{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4 border-b border-white/5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/70" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.currentTarget.value)}
                    placeholder="Kayıtlarda ara..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-10 pr-4 py-2 text-sm text-white placeholder:text-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                {fields && (
                  <button
                    onClick={() => openEditor('create')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:brightness-110 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni {label.split(' ')[0]}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-blue-100">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Kayıtlar yükleniyor...
                  </div>
                ) : fetchError ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-red-200 px-6">
                    <p className="font-semibold mb-2">Veriler alınamadı</p>
                    <p className="text-sm opacity-80 mb-4">{fetchError}</p>
                    <button
                      onClick={loadItems}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-blue-100 px-6">
                    <p className="font-semibold mb-2">Kayıt bulunamadı</p>
                    <p className="text-sm opacity-80">Yeni içerikler oluşturmak için yukarıdan “Yeni” butonunu kullanın.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-blue-50/90">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur border-b border-white/5">
                      <tr>
                        {columns.map(column => (
                          <th key={column.key} className="px-6 py-3 text-left font-semibold text-xs tracking-wide uppercase text-blue-200/70">
                            {column.label}
                          </th>
                        ))}
                        {activeResource !== 'logs' && <th className="px-6 py-3 text-right text-blue-200/70 text-xs">İşlemler</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={getPrimaryId(item)} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                          {columns.map(column => (
                            <td key={column.key} className="px-6 py-4">
                              {column.render ? column.render((item as Record<string, any>)[column.key], item) : (item as Record<string, any>)[column.key] ?? '-'}
                            </td>
                          ))}
                          {activeResource !== 'logs' && (
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  className="rounded-full border border-white/10 p-2 text-blue-100/80 hover:text-white hover:border-white/30 transition"
                                  onClick={() => openEditor('edit', item)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  className="rounded-full border border-white/10 p-2 text-red-200/80 hover:text-red-100 hover:border-red-200/40 transition"
                                  onClick={() => handleDelete(item)}
                                  disabled={saving}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {editorOpen && fields && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full border-l border-white/10 bg-slate-900/95 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <p className="text-xs text-blue-200/80 uppercase tracking-wide">
                  {editorMode === 'create' ? 'Yeni kayıt' : 'Güncelleme'} • {label}
                </p>
                <h2 className="text-xl font-semibold text-white">{editorMode === 'create' ? 'Yeni içerik oluştur' : 'Kaydı düzenle'}</h2>
              </div>
              <button onClick={() => setEditorOpen(false)} className="rounded-full border border-white/10 p-2 text-white/90 hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
              {fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-blue-100/90">
                    {field.label}
                    {field.required && <span className="text-red-300 ml-1">*</span>}
                  </label>
                  {renderField(field, formValues[field.key] ?? '', value =>
                    setFormValues(prev => ({
                      ...prev,
                      [field.key]: value,
                    })),
                  )}
                  {field.helper && <p className="text-xs text-blue-200/70">{field.helper}</p>}
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                  onClick={() => setEditorOpen(false)}
                  disabled={saving}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:brightness-110 transition flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

async function callAdminApi<T>({
  resource,
  method = 'GET',
  id,
  body,
}: {
  resource: Resource;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  id?: string | null;
  body?: Record<string, any>;
}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Önce admin olarak giriş yapmalısınız');
  }

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`);
  url.searchParams.set('resource', resource);
  if (id) url.searchParams.set('id', id);

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? 'İşlem başarısız oldu');
  }

  return payload?.data as T;
}

function getPrimaryId(item: ResourceRecord | null | undefined) {
  if (!item) return '';
  return (
    ((item as PageRow).id as string | undefined) ??
    ((item as PostRow).id as string | undefined) ??
    ((item as MediaRow).id as string | undefined) ??
    ((item as ActivityRow).id?.toString()) ??
    ((item as SettingRow).key as string | undefined) ??
    ''
  );
}

function preparePayload(resource: Resource, values: Record<string, string>) {
  const payload: Record<string, any> = {};

  const fields = RESOURCE_CONFIG[resource].fields ?? [];
  fields.forEach(field => {
    let value = values[field.key];

    if (value === undefined || value === '') {
      payload[field.key] = JSON_FIELDS[resource].includes(field.key) ? {} : undefined;
      return;
    }

    if (JSON_FIELDS[resource].includes(field.key)) {
      try {
        payload[field.key] = JSON.parse(value);
      } catch {
        throw new Error(`${field.label} alanı geçerli bir JSON değil`);
      }
      return;
    }

    if (ARRAY_FIELDS[resource].includes(field.key)) {
      payload[field.key] = value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
      return;
    }

    if (field.type === 'datetime') {
      payload[field.key] = new Date(value).toISOString();
      return;
    }

    if (field.key === 'size_bytes') {
      payload[field.key] = Number(value) || null;
      return;
    }

    if (field.key === 'is_public') {
      payload[field.key] = value === 'true';
      return;
    }

    payload[field.key] = value;
  });

  return payload;
}

function renderField(field: FormField, value: string, onChange: (value: string) => void) {
  const common =
    'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

  if (field.type === 'textarea' || field.type === 'json') {
    return (
      <textarea
        rows={field.rows ?? 4}
        className={common}
        value={value}
        onChange={e => onChange(e.currentTarget.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select className={common} value={value} onChange={e => onChange(e.currentTarget.value)}>
        <option value="">Seçiniz</option>
        {field.options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === 'datetime' ? 'datetime-local' : 'text'}
      className={common}
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      placeholder={field.placeholder}
    />
  );
}

function formatRelative(date: string | null | undefined) {
  if (!date) return '-';
  const target = new Date(date);
  if (Number.isNaN(target.valueOf())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(target);
}

function buildStats(resource: Resource, records: ResourceRecord[]) {
  if (records.length === 0) {
    return [
      { title: 'Toplam Kayıt', value: '0', subtitle: 'Henüz veri yok' },
      { title: 'Durum', value: '—', subtitle: 'Veri ekleyin' },
      { title: 'Güncel İçerik', value: '—', subtitle: 'Bekleniyor' },
    ];
  }

  switch (resource) {
    case 'pages': {
      const published = records.filter(r => (r as PageRow).status === 'published').length;
      return [
        { title: 'Toplam Sayfa', value: records.length.toString(), subtitle: 'Aktif + taslak' },
        { title: 'Yayınlanan', value: published.toString(), subtitle: 'Çevrimiçi içerik' },
        {
          title: 'Son Güncelleme',
          value: formatRelative((records[0] as PageRow).updated_at),
          subtitle: 'En güncel sayfa',
        },
      ];
    }
    case 'posts': {
      const scheduled = records.filter(r => (r as PostRow).status === 'scheduled').length;
      return [
        { title: 'Toplam Yazı', value: records.length.toString(), subtitle: 'Blog + haber' },
        { title: 'Planlanan', value: scheduled.toString(), subtitle: 'Takvimde bekleyenler' },
        {
          title: 'Son Yayın',
          value: formatRelative((records[0] as PostRow).published_at),
          subtitle: 'Yayın tarihine göre',
        },
      ];
    }
    case 'media': {
      const totalSize = records.reduce((acc, row) => acc + Number((row as MediaRow).size_bytes ?? 0), 0);
      return [
        { title: 'Varlık sayısı', value: records.length.toString(), subtitle: 'Storage nesneleri' },
        { title: 'Toplam boyut', value: formatBytes(totalSize), subtitle: 'Yaklaşık değer' },
        {
          title: 'Son yükleme',
          value: formatRelative((records[0] as MediaRow).created_at),
          subtitle: 'Yeni medya',
        },
      ];
    }
    case 'settings':
      return [
        { title: 'Ayar sayısı', value: records.length.toString(), subtitle: 'Key/value çifti' },
        {
          title: 'Public ayar',
          value: records.filter(r => (r as SettingRow).is_public).length.toString(),
          subtitle: 'Frontend paylaşımı',
        },
        {
          title: 'Son güncelleme',
          value: formatRelative((records[0] as SettingRow).updated_at),
          subtitle: 'En güncel kayıt',
        },
      ];
    case 'logs':
    default:
      return [
        { title: 'Log sayısı', value: records.length.toString(), subtitle: 'Son 50 aksiyon' },
        {
          title: 'Admin',
          value: (records[0] as ActivityRow).actor_id?.slice(0, 8) ?? '—',
          subtitle: 'En aktif kullanıcı',
        },
        {
          title: 'Zaman damgası',
          value: formatRelative((records[0] as ActivityRow).created_at),
          subtitle: 'Son aksiyon',
        },
      ];
  }
}

function formatBytes(size: number) {
  if (!size || Number.isNaN(size)) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let value = size;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
}

function selectOptions(options: string[]) {
  return options.map(option => ({
    label: option.charAt(0).toUpperCase() + option.slice(1),
    value: option,
  }));

