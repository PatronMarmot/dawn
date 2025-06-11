# 🎮 Epic Card Battle - Ultimate Visual Edition (3v3 + Büyü Sistemi + Online Multiplayer)

🚀 **Gerçek görselli kart savaş oyunu!** Artık 3v3 savaş sistemi + Büyü sistemi + **ONLINE MULTIPLAYER** destekli!

## 🌐 YENİ! ONLINE MULTIPLAYER

### 🎯 Gerçek Zamanlı Multiplayer Özellikleri
- **👥 2 Oyuncu**: Arkadaşınızla gerçek zamanlı savaş
- **🏠 Oyun Odası**: Benzersiz ID ile oyun oluşturma
- **🚪 Katılım**: ID ile oyunlara katılma
- **⏰ Sıralı Tur**: 30 saniye tur sistemi
- **🎯 Canlı Etkileşim**: Kartlar anında görünür
- **🔮 Büyü Senkronizasyonu**: Büyüler gerçek zamanlı

### 🚀 Multiplayer Nasıl Çalıştırılır

**1. Sunucuyu Başlat:**
```bash
# Kolay yol
Server_Baslat.bat (çift tık)

# Manuel yol
npm install
node server.js
```

**2. Oyunu Aç:**
```bash
Oyunu_Baslat.bat (çift tık)
# veya tarayıcıda index.html
```

**3. Multiplayer Oyna:**
- Ana menüden "ÇOK OYUNCULU" seç
- "OYUN OLUŞTUR" → ID'yi arkadaşına ver
- "OYUNA KATIL" → Arkadaşının ID'sini gir

## 🎮 Oynanış (Multiplayer)

### 🏠 Host (Oyun Oluşturan)
1. "OYUN OLUŞTUR" tıkla
2. Oyun ID'sini al (örn: ABC123)
3. ID'yi arkadaşına gönder
4. Arkadaşın katılmasını bekle
5. Otomatik oyun başlar

### 🚪 Guest (Katılan)
1. "OYUNA KATIL" tıkla  
2. Arkadaşının ID'sini gir
3. Otomatik bağlan
4. Oyun başlayınca sıran gelince oyna

### ⚔️ Savaş Sistemi
- **Sıralı Oyun**: 30 saniye tur süresi
- **Kart Yerleştirme**: 3 birim + 1 büyü hazırla
- **Büyü Aşaması**: İsteğe bağlı büyü kullan
- **Savaş**: Otomatik 3v3 hesaplama
- **Kazanan**: En fazla kart öldüren kazanır

## 🎨 YENİ GÖRSEL SİSTEMİ

### 🖼️ Gerçek Kart Görselleri
- **✅ Elf Okçu**: okcu.png (gerçek görsel)
- **✅ Savaşçı Cadı**: cadi.svg (SVG placeholder → MCP ile değişecek)
- **✅ Ejder Şövalyesi**: sovalye.svg (SVG placeholder → MCP ile değişecek)
- **✅ Gizli Suikastçi**: suikastci.svg (SVG placeholder → MCP ile değişecek)
- **✅ Büyücü Usta**: buyucu.svg (SVG placeholder → MCP ile değişecek)
- **✅ Kızıl Goblin**: goblin.svg (SVG placeholder → MCP ile değişecek)
- **✅ Kristal Gardiyan**: gardiyan.svg (SVG placeholder → MCP ile değişecek)
- **✅ Ruh Avcısı**: ruh_avcisi.svg (SVG placeholder → MCP ile değişecek)

### 🎯 Görsel Teknolojileri
- **PNG/JPG Desteği**: Gerçek karakter görselleri
- **SVG Desteği**: Vektör tabanlı cartified görüntüler
- **Object Tag**: SVG dosyaları için optimize edilmiş rendering
- **CSS Filters**: Can durumuna göre renk efektleri
- **Hover Effects**: Kartlara yaklaşınca görsel efektler

### 🔄 MCP Entegrasyonu
- **Auto-Detection**: Görsel varsa göster, yoksa emoji
- **Hot-Swap Ready**: MCP görselleri eklendiğinde otomatik güncelleme
- **Format Support**: PNG, JPG, SVG tüm formatlar desteklendi
- **Future-Proof**: Yeni görseller kolayca eklenebilir

## 🎮 Geliştirilmiş Özellikler

### 🎬 Görsel Animasyonlar
- **Image Scaling**: Hover'da görseller büyür
- **Filter Effects**: Brightness, contrast, saturation kontrolü
- **Health Filters**: Yaralı kartlarda renk değişimi
- **Bot Differentiation**: Bot kartları farklı hue rotation

### 🎨 CSS Sanatı
- **SVG Gradients**: Her kart türü için özel gradientler
- **Dynamic Filters**: Gerçek zamanlı renk efektleri
- **Performance**: GPU accelerated görsel işleme
- **Responsive**: Mobil cihazlarda optimize görsel boyutlar

## 📁 Güncellenmiş Dosya Yapısı

```
Epic Card Battle/
├── index.html          # Ana oyun + menü sistemi
├── style.css           # SVG + IMG desteği + görsel efektler
├── script.js           # Görsel detection + SVG support
├── images/             # 🖼️ GÖRSEL GALERİSİ
│   ├── okcu.png        # ✅ Gerçek Elf Okçu görseli
│   ├── cadi.svg        # 🎨 SVG Cadı placeholder (MCP ready)
│   ├── sovalye.svg     # 🎨 SVG Şövalye placeholder (MCP ready)
│   ├── suikastci.svg   # 🎨 SVG Suikastçi placeholder (MCP ready)
│   ├── buyucu.svg      # 🎨 SVG Büyücü placeholder (MCP ready)
│   ├── goblin.svg      # 🎨 SVG Goblin placeholder (MCP ready)
│   ├── gardiyan.svg    # 🎨 SVG Gardiyan placeholder (MCP ready)
│   └── ruh_avcisi.svg  # 🎨 SVG Ruh Avcısı placeholder (MCP ready)
├── Oyunu_Baslat.bat    # Tek tık başlatma
└── README.md           # Bu kılavuz
```

## 🎯 Görsel Sistem Teknolojileri

### 🖼️ Desteklenen Formatlar
| Format | Kullanım | Avantaj |
|--------|----------|---------|
| **PNG** | Gerçek karakterler | Yüksek kalite, transparency |
| **JPG** | Fotoğraf tarzı | Küçük dosya boyutu |
| **SVG** | Vektör grafikler | Scalable, CSS effects |
| **Emoji** | Fallback | Evrensel destek |

### 🎨 CSS Görsel Efektleri
```css
/* Can durumu görsel efektleri */
.card-image.low-health .card-img {
    filter: sepia(0.3) hue-rotate(30deg);
}

.card-image.critical-health .card-img {
    filter: sepia(0.5) hue-rotate(320deg);
}

/* Hover efektleri */
.card:hover .card-img {
    filter: contrast(1.3) saturate(1.4) brightness(1.1);
    transform: scale(1.05);
}
```

### ⚡ Performans Optimizasyonları
- **Object Tag**: SVG'ler için optimize rendering
- **Transform3D**: GPU accelerated görsel işleme
- **Will-Change**: Animasyon öncesi GPU hazırlığı
- **Lazy Detection**: Görsel varlık kontrolü optimize

## 🎮 Yeni Oyun Deneyimi (3v3 Savaş Sistemi)

### 🎨 Görsel Kartlar
```
┌─────────────────────────────┐
│     🤖 BOT KARTLARI        │
├─────────────────────────────┤
│ [🐉SVG] [🧙‍♀️SVG] [🧝‍♂️PNG] [👻SVG] │ ← Gerçek görseller!
└─────────────────────────────┘

┌─────────────────────────────┐
│         ARENA               │
│  [👤IMG] VS [🤖SVG]        │ ← Görsel savaş!
└─────────────────────────────┘

┌─────────────────────────────┐
│    🃏 SENİN KARTLARIN      │
│ [🗡️SVG] [🔮SVG] [💎SVG] [👹SVG] │ ← Hepsinde görsel!
└─────────────────────────────┘
```

## 🔄 MCP Görsel Güncellemesi

### 🎯 Nasıl Çalışır?
1. **MCP Servisi Düzeldiğinde** → Gerçek görseller oluştur
2. **images/ klasörüne ekle** → PNG/JPG formatında
3. **Script otomatik algılar** → SVG yerine gerçek görsel kullanır
4. **Instant Update** → Sayfa yenileme gerektirmez

### 🎨 Placeholder → Real Görseller
```javascript
// Otomatik görsel algılama
const imageExists = checkImageExists(card.image);
const cardImageContent = imageExists 
    ? `<img src="images/${card.image}" alt="${card.name}" />` 
    : card.icon; // Fallback emoji
```

## 🎯 Görsel Efekt Özellikleri

### 🌈 Can Durumu Renkleri
- **🟢 Sağlıklı**: Normal renkler
- **🟡 Yaralı**: Sarı sepia efekti + yanıp söner
- **🔴 Kritik**: Kırmızı sepia efekti + hızlı yanıp söner

### ✨ Animasyon Efektleri
- **Hover Scale**: Kartlar büyür (105%)
- **Brightness**: Parlaklık artışı (%130)
- **Saturation**: Renk doygunluğu artışı (%140)
- **Contrast**: Kontrast artışı (%130)

### 🤖 Bot Ayrımı
- **Hue Rotation**: Bot kartları 20° hue shift
- **Border Color**: Kırmızı kenarlık
- **Background**: Kırmızı gradient

## 🚀 Nasıl Başlatılır

1. **`Oyunu_Baslat.bat`** çift tık
2. **Ana menüde "⚔️ OYUNA BAŞLA"**
3. **Gerçek görselli kartları gör! 🖼️**
4. **Visual savaş deneyimi! 🎨**

## 🎨 Görsel Kalite Karşılaştırması

| Özellik | Eski Versiyon | Visual Edition |
|---------|---------------|----------------|
| Kart Görselleri | Sadece Emoji | PNG + SVG + Emoji |
| Görsel Efektler | Yok | CSS Filters + Hover |
| Can Durumu | Sadece Renk | Görsel + Renk Efektleri |
| Bot Ayrımı | Basit Renk | Hue Rotation + Border |
| Format Desteği | Emoji Only | PNG/JPG/SVG/Emoji |
| MCP Ready | ❌ | ✅ Hot-Swap |

## 🏆 Sonuç

Artık **gerçek bir kart oyunu** gibi:
- 🖼️ **Her kartta gerçek görsel**
- 🎨 **CSS sanat efektleri**
- ⚡ **GPU accelerated rendering**
- 🔄 **MCP hot-swap ready**
- 📱 **Mobile optimized visuals**

**MCP servisi düzeldiğinde** tüm SVG'ler gerçek görsellere dönüşecek! 

**Test et ve görsel şöleni yaşa!** 🎮🎨✨

---

## 🆕 YENİ ÖZELLİKLER (v2.0)

### 🔮 BÜYÜ SİSTEMİ
- **Büyü Kartı**: Büyü Asası (BuyuAsasi.svg) ✨
- **Hasar**: 10 hasar verir
- **Kullanım**: Büyü aşamasında tıklayarak kullan
- **Hedef Seçimi**: Manual olarak düşman kartını seç

### ⚔️ 3v3 SAVAŞ SİSTEMİ
- **3 Birim Kart**: Savaş için zorunlu
- **1 Büyü Kart**: İsteğe bağlı
- **20 Saniye Timer**: Büyü kullanma süresi
- **Bot AI**: Bot da büyü kullanıyor

### 🎮 OYNANIS ŞEKİLLİ
1. **Hazırlık**: 3 birim + 1 büyü kart sürükle
2. **Büyü Aşaması**: 20 saniye içinde büyü kullan (isteğe bağlı)
3. **Savaş**: Otomatik 3v3 birim savaşı
4. **Sonuç**: Kazanan belirlenir, ödüller verilir

### 🎨 GÖRSEL YENİLİKLER
- **Mor Büyü Kartları**: Özel gradientli arka plan
- **✨ Sparkle Animasyon**: Büyü kartlarında parıldama efekti
- **Büyü Alanı**: Özel büyü kart alanları
- **Büyü Aşaması Glow**: Büyü aşamasında özel efektler

### 🤖 BOT ZEKASI
- **Büyü Seçimi**: %70 şans ile büyü kullanır
- **Timing**: 5-15 saniye arası rastgele zamanlama
- **Hedef Seçimi**: Rastgele oyuncu kartına saldırır

### 🎯 YENİ! HEDEF SEÇİM SİSTEMİ
- **Manuel Seçim**: Artık büyülerinizi istediğiniz düşmana kullanın!
- **Görsel Feedback**: Hedef seçim modunda kartlar kırmızı parlar
- **Crosshair Cursor**: Mouse üzerinde nisan alma işareti
- **İnteraktif**: Tıklayarak hedef seçin, strateji geliştirin

## 🔧 DÜZELTMELER (v2.1)

### ✅ Çözülen Hatalar:
1. **Aynı Cins Kart Hatası**: Artık aynı isimli kartlar ortak hasar almıyor
2. **Savaş Ortası Büyü**: Savaş ortasında büyü kullanımı engellendi
3. **BuyuAsasi.png**: Görsel dosyası PNG formatına çevrildi

### 🔒 Güvenlik Önlemleri:
- **ID Bazlı Filtreleme**: Her kart benzersiz ID ile tanımlanır
- **Savaş Durumu Kontrolu**: Büyü kullanımı sırasında sıkı kontroller
- **ESC İptali**: Hedef seçimini ESC ile iptal edebilme

---

**Visual Note**: Bu versiyon görsel dosya formatlarının tamamını destekler. MCP servisi çalıştığında, placeholder SVG'lerin yerine gerçek fantasy karakter görselleri eklenecek ve oyun tam bir görsel deneyime dönüşecek!