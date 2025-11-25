# Neokreatif SEO Araçları - Full Stack SEO Analiz Platformu

Modern ve kapsamlı bir SEO analiz platformu. React, TypeScript, Tailwind CSS, Supabase ve Edge Functions ile geliştirilmiştir.

## 🚀 Özellikler

### Frontend

- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS ile modern ve responsive tasarım
- 🔍 Gerçek zamanlı SEO analizi
- 👤 Kullanıcı kimlik doğrulama sistemi
- 📊 Detaylı analiz sonuçları görüntüleme
- 📱 Mobil uyumlu tasarım

### Backend

- 🗄️ Supabase PostgreSQL veritabanı
- 🔐 Row Level Security (RLS) ile güvenli veri erişimi
- ⚡ Serverless Edge Functions
- 🔑 JWT tabanlı kimlik doğrulama

### SEO Analiz Özellikleri

- 📈 Sayfa hızı analizi (PageSpeed)
- 🎯 Anahtar kelime sıralama takibi
- 🏆 SEO skoru (Technical, Content, Mobile)
- ⚠️ Sorun tespit ve öneriler
- 📊 Rakip analizi altyapısı

## 🛠️ Teknolojiler

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Icons**: Lucide React
- **Deployment**: Supabase Edge Functions

## 📦 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Çevre Değişkenlerini Yapılandırın

`.env` dosyası zaten yapılandırılmıştır:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Veritabanı Kurulumu

Veritabanı tabloları otomatik olarak oluşturulmuştur:

- `users` - Kullanıcı bilgileri
- `projects` - SEO projeleri
- `seo_analyses` - Analiz sonuçları
- `keywords` - Anahtar kelime verileri

### 4. Edge Functions

Edge Functions deploy edildi:

- `analyze-domain` - Domain SEO analizi
- `keyword-analysis` - Anahtar kelime analizi

### 5. Uygulamayı Çalıştırın

#### Development Mode

```bash
npm run dev
```

#### Production Build

```bash
npm run build
npm run preview
```

## 🎯 Kullanım

### Yeni Kullanıcı Kaydı

1. "Giriş Yap" butonuna tıklayın
2. "Kayıt Ol" sekmesine geçin
3. E-posta ve şifre ile kayıt olun

### SEO Analizi Yapma

1. Ana sayfadaki form alanına domain girin (örn: example.com)
2. "Analiz Et" butonuna tıklayın
3. Analiz sonuçlarını görüntüleyin

### Proje Yönetimi

- Giriş yapan kullanıcılar otomatik olarak proje oluşturabilir
- Daha önce analiz edilen domainler "Projeleriniz" bölümünde görünür
- Projelere tıklayarak hızlı analiz yapabilirsiniz

## 🗄️ Veritabanı Şeması

### Users Tablosu

```sql
- id (uuid, primary key)
- email (text, unique)
- name (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Projects Tablosu

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- domain (text)
- name (text)
- status (text: active/paused/archived)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### SEO Analyses Tablosu

```sql
- id (uuid, primary key)
- project_id (uuid, foreign key)
- analysis_type (text)
- results (jsonb)
- score (integer 0-100)
- created_at (timestamptz)
```

### Keywords Tablosu

```sql
- id (uuid, primary key)
- project_id (uuid, foreign key)
- keyword (text)
- position (integer)
- search_volume (integer)
- difficulty (integer 0-100)
- checked_at (timestamptz)
- created_at (timestamptz)
```

## 🔒 Güvenlik

- **Row Level Security (RLS)**: Tüm tablolarda aktif
- **JWT Authentication**: Supabase Auth ile güvenli kimlik doğrulama
- **API Security**: Edge Functions JWT doğrulaması yapıyor
- **Data Isolation**: Kullanıcılar sadece kendi verilerine erişebilir

## 🧪 Edge Functions API

### Analyze Domain

```bash
POST /functions/v1/analyze-domain
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "domain": "example.com",
  "projectId": "uuid" // optional
}
```

### Keyword Analysis

```bash
POST /functions/v1/keyword-analysis
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "projectId": "uuid",
  "keywords": ["keyword1", "keyword2"], // optional
  "domain": "example.com" // optional
}
```

## 📊 Analiz Sonuçları

Her analiz şunları içerir:

- **Sayfa Hızı Metrikleri**: Score, Load Time, FCP, LCP, TTFB
- **SEO Skorları**: Overall, Technical, Content, Mobile (0-100)
- **Anahtar Kelimeler**: Position, Volume, Difficulty
- **Sorunlar**: Severity (high/medium/low) ile kategorize edilmiş
- **Öneriler**: Actionable SEO önerileri listesi

## 🔄 Geliştirme Notları

- TypeScript strict mode aktif
- ESLint yapılandırması mevcut
- Responsive tasarım mobile-first yaklaşımla geliştirildi
- Dark theme varsayılan olarak kullanılıyor

## 📝 Lisans

Bu proje Neokreatif tarafından geliştirilmiştir.

## 🤝 Katkıda Bulunma

Geliştirme için pull request açabilirsiniz. Büyük değişiklikler için önce issue açmanız önerilir.

## 📧 İletişim

- Email: neokreatiff@gmail.com
- Telefon: +90 544 190 44 47
