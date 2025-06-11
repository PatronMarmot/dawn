# Epic Card Battle - Render Deploy Fix

## Render 404 Not Found Çözümü

### Sorun:
- `https://dawn-fi92.onrender.com` → 404 Not Found
- Index.html dosyası bulunamıyor

### Çözüm 1: Render Ayarları
Render Dashboard'da:
1. **Service Settings** → **Build & Deploy**
2. **Build Command**: `echo "No build needed"`
3. **Start Command**: `serve -s . -p $PORT`
4. **Root Directory**: `/` (boş bırak)

### Çözüm 2: Package.json Güncelle
```json
{
  "scripts": {
    "start": "serve -s . -p $PORT",
    "build": "echo 'Static site, no build needed'"
  },
  "dependencies": {
    "serve": "^14.2.1"
  }
}
```

### Çözüm 3: Vercel'e Geç (Önerilen)
Render'da sorunlar var, Vercel daha stabil:
1. Git push yap
2. https://vercel.com/new
3. dawn repo'sunu seç
4. Deploy!

### Test URL'leri:
- ❌ Render: https://dawn-fi92.onrender.com (404)
- ✅ Vercel: https://dawn-xyz.vercel.app (çalışacak)

## Render Düzeltme Adımları:

1. **Render Dashboard'a git**
2. **dawn-fi92** servisini seç
3. **Settings** → **Build & Deploy**
4. **Start Command** değiştir: `serve -s . -p $PORT`
5. **Manual Deploy** yap

Ya da direkt **Vercel'e geç**! 🚀