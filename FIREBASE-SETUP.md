# Firebase Kayıt Sistemi Kurulum Rehberi

## 1. Firebase Projesi Oluştur

1. https://console.firebase.google.com/ adresine git
2. "Create a project" tıkla
3. Proje adını gir (örn: "dawn-education")
4. Google Analytics'i aktif et (isteğe bağlı)
5. Projeyi oluştur

## 2. Authentication Ayarları

1. Sol menüden "Authentication" seç
2. "Get started" tıkla
3. "Sign-in method" sekmesine git
4. "Email/Password" aktif et
5. "Google" aktif et (isteğe bağlı)

## 3. Firestore Database Oluştur

1. Sol menüden "Firestore Database" seç
2. "Create database" tıkla
3. "Start in test mode" seç
4. Lokasyon seç (europe-west için)

## 4. Web App Ekle

1. Project Overview'da web ikonu (</>) tıkla
2. App nickname gir
3. "Register app" tıkla
4. Config bilgilerini kopyala

## 5. Config Bilgilerini Güncelle

`register-firebase.html` dosyasındaki config kısmını değiştir:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## 6. Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Dosya Yapısı

```
dawn/
├── register-firebase.html (Firebase kayıt)
├── register.html (LocalStorage kayıt)
├── login-firebase.html (Firebase giriş)
├── login.html (LocalStorage giriş)
├── js/
│   ├── register-firebase.js
│   └── login-firebase.js
```

## 8. Test Et

1. register-firebase.html'i tarayıcıda aç
2. Yeni kullanıcı kaydet
3. Firebase Console'da Authentication'a bak
4. Firestore'da users koleksiyonunu kontrol et

## Avantajları

✅ Gerçek authentication
✅ Google ile giriş
✅ Güvenli veri saklama  
✅ E-posta doğrulama
✅ Şifre sıfırlama
✅ Ücretsiz 50,000 okuma/gün