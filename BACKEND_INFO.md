# Backend Bilgilendirme Dosyası

## ✅ Kurulum Tamamlandı

### Veritabanı Tabloları
Tüm tablolar başarıyla oluşturuldu ve RLS (Row Level Security) etkinleştirildi:

1. **users** - Kullanıcı bilgileri
   - ✅ RLS Aktif
   - ✅ Politikalar: SELECT, INSERT, UPDATE

2. **projects** - SEO projeleri
   - ✅ RLS Aktif
   - ✅ Politikalar: SELECT, INSERT, UPDATE, DELETE
   - ✅ Foreign Key: user_id -> users(id)

3. **seo_analyses** - Analiz sonuçları
   - ✅ RLS Aktif
   - ✅ Politikalar: SELECT, INSERT
   - ✅ Foreign Key: project_id -> projects(id)
   - ✅ JSONB formatında esnek veri saklama

4. **keywords** - Anahtar kelime verileri
   - ✅ RLS Aktif
   - ✅ Politikalar: SELECT, INSERT, UPDATE
   - ✅ Foreign Key: project_id -> projects(id)

### Yeni Admin CMS Tabloları
Supabase üzerinde admin panel için gereken içerik şeması sıfırdan kuruldu:

- **pages**: Statik sayfalar için slug, içerik JSONB, SEO meta alanları, `author_id` / `editor_id` referansları ve `published_at` zaman damgası içerir. Yayınlanan sayfalar herkese açık, diğer tüm işlemler yalnızca `admin` rolüyle yapılabilir.
- **page_revisions**: Her sayfa güncellemesinin versiyon, başlık, özet ve içerik snapshotlarını saklar; rollback için kullanılır.
- **posts**: Blog/haber içerikleri için statü (draft/review/published), tag dizisi, kapak görseli ve yayın tarihi alanlarına sahiptir.
- **media_assets**: Supabase Storage’a yüklenen dosyaların bucket/path, MIME, dosya boyutu ve açıklama metadatasını tutar.
- **site_settings**: `key/value` JSONB yapısıyla site durumunu (örn. bakım modu) yönetir; `is_public` flag’i sayesinde frontend yalnızca paylaşılabilir ayarları okuyabilir.
- **admin_activity_logs**: Tüm CRUD aksiyonlarını `actor_id`, `action`, `entity_type`, `metadata` alanlarıyla kaydeder; sadece admin rolü okuyabilir/ekleyebilir.

Her tabloda RLS zorunlu. Politikalar Supabase JWT içindeki `role = admin` claim’ini kontrol eder. Public-facing içerik (yayınlanmış `pages` ve `posts`) anonim kullanıcılar tarafından okunabilir, diğer tüm aksiyonlar admin rolüyle sınırlıdır. Ayrıca `update_updated_at_column()` trigger’ı sayfa/post/site_settings tablolarında otomatik timestamp güncellemesi yapar.

### Edge Functions
6 Edge Function Supabase projesi `cchgusotdmiabshxjjof` üzerine yeniden deploy edildi:

1. **analyze-domain** – Domain SEO analizi, hız metrikleri, skorlar, sorun/öneri listesi
2. **analyze-domain-real** – Gerçek PageSpeed verisiyle zenginleştirilmiş domain analizi
3. **keyword-analysis** – Anahtar kelime sıralama ve metrik hesaplama
4. **generate-report** – PDF/rapor çıktısı üretimi
5. **send-support-email** – Destek talebi e-postalarını Supabase fonksiyonundan iletir
6. **seo-report** – Kapsamlı teknik/content raporlarını toplu üretir

Tüm fonksiyonlarda JWT doğrulaması ve paylaşılan Supabase URL/env değişkenleri güncel durumda.

### Güvenlik Özellikleri

#### Row Level Security (RLS)
- ✅ Tüm tablolarda RLS etkin
- ✅ Kullanıcılar sadece kendi verilerine erişebilir
- ✅ JWT tabanlı kimlik doğrulama
- ✅ Foreign key cascade delete protection

#### API Security
- ✅ Edge Functions JWT doğrulaması yapıyor
- ✅ CORS headers doğru yapılandırılmış
- ✅ Input validation aktif
- ✅ Error handling implement edildi

### İndeksler
Performans için önemli indeksler oluşturuldu:
- ✅ idx_projects_user_id
- ✅ idx_projects_domain
- ✅ idx_seo_analyses_project_id
- ✅ idx_seo_analyses_type
- ✅ idx_keywords_project_id
- ✅ idx_keywords_keyword

### Trigger'lar
- ✅ update_updated_at_column() - Otomatik timestamp güncelleme
- ✅ users tablosu için trigger aktif
- ✅ projects tablosu için trigger aktif

## 🚀 API Endpoints

### 1. Domain Analizi
```bash
POST https://cchgusotdmiabshxjjof.supabase.co/functions/v1/analyze-domain
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "domain": "example.com",
  "projectId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "pageSpeed": {
      "score": 85,
      "loadTime": 2.5,
      "metrics": {
        "fcp": 1.2,
        "lcp": 2.1,
        "ttfb": 0.3
      }
    },
    "seoScore": {
      "overall": 82,
      "technical": 85,
      "content": 80,
      "mobile": 81
    },
    "keywords": [...],
    "issues": [...],
    "recommendations": [...]
  },
  "timestamp": "2024-..."
}
```

### 2. Keyword Analizi
```bash
POST https://cchgusotdmiabshxjjof.supabase.co/functions/v1/keyword-analysis
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "projectId": "uuid",
  "keywords": ["keyword1", "keyword2"], // optional
  "domain": "example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keywords": [...],
    "summary": {
      "total": 10,
      "inTop10": 3,
      "inTop50": 7,
      "avgPosition": 35,
      "totalVolume": 15000
    }
  },
  "timestamp": "2024-..."
}
```

## 📊 Veri Akışı

```
User -> Frontend (React)
         ↓
    Authentication (Supabase Auth)
         ↓
    Edge Functions (analyze-domain / keyword-analysis)
         ↓
    Database (PostgreSQL with RLS)
         ↓
    Response to Frontend
```

## 🔐 Güvenlik Kontrol Listesi

- [x] RLS tüm tablolarda aktif
- [x] JWT verification Edge Functions'larda aktif
- [x] Foreign key constraints tanımlı
- [x] Input validation yapılıyor
- [x] CORS headers doğru
- [x] Error handling implement edilmiş
- [x] Cascade delete koruması var
- [x] Indexes performans için optimize edildi

## ✨ Özellikler

### Gerçek Zamanlı Analiz
- Domain girildiğinde anında analiz başlatılıyor
- Loading states ile kullanıcı bilgilendiriliyor
- Error handling ile kullanıcı dostu hatalar gösteriliyor

### Proje Yönetimi
- Otomatik proje oluşturma
- Mevcut projeleri listeleme
- Proje durumu takibi (active/paused/archived)

### Kullanıcı Deneyimi
- Responsive tasarım (mobile-first)
- Modern ve profesyonel UI
- Animasyonlu transitions
- Loading states
- Error feedback

## 🎯 Sonuç

✅ Backend tamamen çalışır durumda
✅ Frontend backend ile entegre
✅ Güvenlik önlemleri alındı
✅ Database optimizasyonları yapıldı
✅ API endpoints test edilebilir durumda
✅ Production-ready

Sistem şu anda tam çalışır durumda ve production'a hazır!
