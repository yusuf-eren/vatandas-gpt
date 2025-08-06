# VatandaşGPT 🇹🇷

> **Not:** Bu proje, BTK Akademi AI Agent Hackathon 2025 kapsamında geliştirilmiştir.

**Canlı demo:** [https://vatandas-gpt.vercel.app/](https://vatandas-gpt.vercel.app/)
**Tanıtım videosu:** [https://youtu.be/zUM6OS7S-Vc?si=2DdPmbuR7lRKwZVc](https://youtu.be/zUM6OS7S-Vc?si=2DdPmbuR7lRKwZVc)
**Server linki:** [https://vatandas-gpt-backend-9jq92.ondigitalocean.app/](https://vatandas-gpt-backend-9jq92.ondigitalocean.app/)

Türk vatandaşları için özel olarak tasarlanmış, yapay zeka destekli çok amaçlı asistan platformu. VatandaşGPT, emlak, otomobil, haberler ve restoran alanlarında uzmanlaşmış AI ajanlar kullanarak kullanıcılara kapsamlı hizmet sunar.

## 🎯 Proje Hakkında

VatandaşGPT, Türkiye'deki günlük yaşam ihtiyaçlarını karşılamak üzere geliştirilmiş modern bir AI platformudur. Platform, farklı uzmanlık alanlarında özelleşmiş yapay zeka ajanları kullanarak kullanıcılara kişiselleştirilmiş deneyim sunar.

## ✨ Özellikler

### 🏠 Emlak Hizmetleri
- **İstanbul odaklı gayrimenkul arama**
- Gelişmiş filtreleme (fiyat, oda sayısı, bölge, metrekare)
- Mahalle analizi ve ulaşım bilgileri
- Yatırım tavsiyeleri ve piyasa analizleri
- Emlakjet entegrasyonu ile güncel ilanlar

### 🚗 Otomobil Hizmetleri
- **İstanbul araç piyasası uzmanı**
- Arabam.com verilerinden güncel araç ilanları
- Vector arama ile anlam bazlı araç bulma
- Detaylı araç özellikleri ve hasar kayıtları
- Marka, model, fiyat ve kilometre bazlı filtreleme
- Piyasa analizi ve uzman tavsiyeleri

### 📰 Haber Servisi
- **Profesyonel haber spikeri deneyimi**
- Exa.ai ile güncel haber takibi
- Kategori bazlı haber filtreleme (ekonomi, spor, teknoloji, sağlık)
- Görsel destekli haber sunumu
- Son dakika haberleri ve analizi

### 🍽️ Restoran Keşif
- **Trendyol Yemek entegrasyonu**
- Konum bazlı restoran arama
- Menü analizi ve fiyat karşılaştırması
- Mutfak türü ve özel diyet seçenekleri
- Restoran değerlendirmeleri ve önerileri

## 🏗️ Teknik Mimari

### Backend (Node.js + TypeScript)
- **AI Framework**: OpenAI Agents + Google Gemini
- **Veritabanı**: MongoDB (Atlas Vector Search)
- **Web Scraping**: Cheerio + Axios
- **API**: Express.js RESTful servisleri
- **Kimlik Doğrulama**: JWT tabanlı auth sistemi

### Frontend (React + TypeScript)
- **UI Framework**: React 18 + Vite
- **Tasarım Sistemi**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query + Context API
- **Routing**: React Router v6
- **Tema**: Dark/Light mode desteği
- **Responsive**: Mobil uyumlu tasarım

### AI ve Veri İşleme
- **Model**: Google Gemini 2.5 Pro/Flash
- **Embedding**: OpenAI text-embedding-3-large
- **Vector Search**: MongoDB Atlas Search
- **Çok Ajanlı Sistem**: Özelleşmiş AI ajanları
- **Anlam Bazlı Arama**: Vector embeddings

## 📦 Kurulum

### Gereksinimler
- Node.js 18+ 
- MongoDB Atlas hesabı
- Google AI API anahtarı
- OpenAI API anahtarı

### Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

### Frontend Kurulumu  
```bash
cd frontend
npm install
npm run dev
```

### Ortam Değişkenleri (.env)
```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=vatandas-gpt

# AI APIs
GOOGLE_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key

# Authentication
JWT_SECRET=your_jwt_secret

# Scraping
EXA_API_KEY=your_exa_key

# Server
PORT=3001
```

## 🚀 Başlatma

### Geliştirme Ortamı
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# Production Build
npm run build
```

### Veri Toplama (Opsiyonel)
```bash
# Araç verilerini topla
cd backend && npm run scrape:cars

# Emlak verilerini topla  
cd backend && npm run scrape:properties
```

## 🔧 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

### Chat Sistemi
- `POST /api/chat` - AI ile sohbet
- `GET /api/chat/conversations` - Sohbet geçmişi
- `DELETE /api/chat/conversations/:id` - Sohbet silme

## 📱 Kullanım

1. **Kayıt/Giriş**: Ücretsiz hesap oluşturun
2. **Hizmet Seçimi**: Emlak, araç, haber veya restoran hizmetini seçin
3. **Doğal Dil**: Türkçe olarak ihtiyacınızı belirtin
4. **AI Yönlendirme**: Sistem sizi uygun uzman ajana yönlendirir
5. **Sonuçlar**: Detaylı ve görsellerle destekli sonuçlar alın

## 🎨 Ekran Görüntüleri

### Ana Sayfa
Modern ve kullanıcı dostu arayüz ile hızlı hizmet seçimi

### Emlak Arama
İstanbul'daki gayrimenkul seçeneklerini filtreleyerek bulun

### Araç Arama  
Detaylı araç bilgileri ve piyasa analizleri

### Haber Merkezi
Profesyonel spiker tarzında haber sunumu

## 🛠️ Geliştirici Bilgileri

### Proje Yapısı
```
vatandas-gpt/
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── agents/    # AI ajanları
│   │   ├── api/       # REST API
│   │   ├── models/    # MongoDB modelleri
│   │   ├── scraper/   # Veri toplama
│   │   └── middleware/# Express middleware
├── frontend/          # React frontend  
│   ├── src/
│   │   ├── components/# UI bileşenleri
│   │   ├── pages/     # Sayfa bileşenleri
│   │   ├── contexts/  # React context
│   │   └── hooks/     # Custom hooks
└── README.md
```

### Katkıda Bulunma
1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📊 Performans

- **Yanıt Süresi**: < 2 saniye (ortalama)
- **Veri Kapsamı**: 100K+ araç ilanı, güncel emlak verileri
- **Güncellik**: 24 saatte bir otomatik veri güncelleme
- **Doğruluk**: %95+ veri doğruluğu

## 🔐 Güvenlik

- JWT tabanlı kimlik doğrulama
- CORS koruması
- API rate limiting
- Veri şifreleme
- Güvenli environment variables

## 📄 Lisans

Bu proje Apache 2.0 lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 İletişim

- **Proje**: VatandaşGPT
- **GitHub**: [actuallyzefe/text-to-home](https://github.com/actuallyzefe/text-to-home)
- **Demo**: Canlı demo için projeyi yerel olarak çalıştırın

## 🙏 Teşekkürler

- OpenAI ve Google AI ekiplerine AI teknolojileri için
- Arabam.com ve Emlakjet'e veri kaynakları için  
- Trendyol'a restoran entegrasyonu için
- Türkiye geliştirici topluluğuna sürekli destek için

---

**VatandaşGPT** - Türk vatandaşları için, Türk geliştiriciler tarafından ❤️