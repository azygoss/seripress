# SeriPress

Tamamen çevrimdışı çalışan React Native (Expo) spor/fitness uygulaması.
1.324 animasyonlu egzersiz, hazır antrenman programları, özel program oluşturucu,
antrenman oynatıcı (set/dinlenme sayaçlı) ve geçmiş takibi içerir.

## İndirme

En güncel APK: [Releases](https://github.com/azygoss/seripress/releases/latest)

## Geliştirme

```bash
cd app
npm install --legacy-peer-deps
npx expo prebuild --platform android   # android/ klasörünü üretir
cd android && ./gradlew assembleRelease
```

Egzersiz verisi `app/assets/` içinde gömülüdür; kaynak veri seti:
https://github.com/hasaneyldrm/exercises-dataset (ön işleme: `scripts/prepare-data.js`)

## Yeni sürüm yayınlama

```bash
./scripts/release.sh 1.1.0
```

Versiyonu yükseltir, release APK'sını derler ve GitHub Releases'a yükler.
Uygulama içindeki "Güncellemeleri kontrol et" özelliği bu repo'nun release'lerini kullanır.
