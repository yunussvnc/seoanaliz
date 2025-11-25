# NeoKreatif Admin Paneli

Yeni admin paneli Supabase’deki CMS tablolarını web arayüzü üzerinden yönetebilmeniz için tasarlandı.
Bu döküman; yetkilendirme, fonksiyon uç noktaları ve panel kullanım adımlarını özetler.

## Yetkilendirme
- Panel yalnızca Supabase Auth kayıtlarında `app_metadata.role = "admin"` claim’i olan kullanıcılar için görünür.
- Yeni bir admin tanımlamak için dashboard’da ilgili kullanıcının **User Details → App Metadata** alanına `{ "role": "admin" }` ekleyin.
- Admin paneli içerisindeki her istek `supabase/functions/v1/admin-content` fonksiyonuna JWT ile gider; fonksiyon tarafında da aynı rol kontrolü yapıldığı için çift katmanlı güvenlik sağlanır.

## İçerik Kaynakları
Panel beş ana kaynağı yönetir:

1. **Pages** – Statik sayfalar (slug, meta, içerik JSON).
2. **Posts** – Blog/haber gönderileri (özet, kapak görseli, tag dizisi).
3. **Media** – Supabase Storage meta kayıtları (bucket/path, mime, boyut).
4. **Settings** – Key/value JSON ayarları (`is_public` flag’i ile frontend paylaşımı).
5. **Logs** – `admin_activity_logs` tablosundan gelen audit kayıtları (sadece okunur).

## Fonksiyon Akışı
- Kaynak seçildiğinde panel `admin-content` fonksiyonuna `resource` query parametresi göndererek kayıtları çeker.
- CRUD işlemlerinde aynı fonksiyon `POST/PATCH/DELETE` metotlarını kullanır; body sadece ilgili kaynağın izin verilen kolonlarını içerir.
- Başarılı işlemler `admin_activity_logs` tablosuna otomatik log olarak yazılır ve panelde “Logs” sekmesinden izlenebilir.

## UI Özellikleri
- **Gradient Kartlar:** Her kaynağın istatistik kartları sitenin koyu mavi temasına uygun turkuaz/mor geçişlerle sunulur.
- **Cam Efektli Layout:** Panel tam ekran modal olarak açılır ve arkadaki SEO sayfasını flu gösterir.
- **Dinamik Form Paneli:** Sağdaki form alanı slug/title/tarih/JSON girişleri için hazır şablonlar sunar, JSON alanları prettify edilmiş şekilde tutulur.
- **Arama & Filtre:** Tablo üstündeki arama kutusu tüm JSON içeriği dahil olmak üzere string filtreleme yapar.

## Kullanım Adımları
1. Supabase’de admin rolüne sahip bir kullanıcıyla giriş yapın.
2. Header’daki “Admin Panel” butonuna tıklayın (mobilde menü içinde).
3. Soldan yönetmek istediğiniz kaynağı seçin; tablo otomatik dolar.
4. “Yeni” butonuyla kayıt oluşturun ya da satırdaki kalem ikonuyla düzenleyin.
5. JSON alanlarını düzenlerken geçerli bir JSON yazmaya dikkat edin; hata durumunda panel uyarı verir.
6. Silme işlemleri geri alınamaz; panel onay sorar ve Supabase’deki kayıt tamamen kaldırılır.

## İleri Seviye
- Panelde kullanılan fonksiyon kodu `supabase/functions/admin-content/index.ts` dosyasındadır; ek validation veya özel iş akışları için bu fonksiyonu genişletebilirsiniz.
- Yeni bir içerik türü eklemek isterseniz önce Supabase’de tablo/migration yazın, ardından `AdminPanel.tsx` içindeki `RESOURCE_CONFIG` objesine yeni kaynağı tanımlayın.

İhtiyacınız olan ek bileşenler veya özel tasarımlar için “gerekirse ekle” yönlendirmesi kapsamında panel genişletilebilir. Yeni talepleri iletmeniz yeterli.

