# SporApp — Agent Instructions

Tamamen çevrimdışı çalışan Türkçe fitness uygulaması. React Native + Expo üretim
build'i APK olarak dağıtılır; Play Store kullanılmaz, güncellemeler GitHub
Releases üzerinden uygulama içinden iner.

## Kritik kural: Expo SDK 57

`app/AGENTS.md` içindeki kural hâlâ geçerli: **Expo API'leri değişti.** Kod
yazmadan önce mutlaka sürümlü dokümanları oku:
https://docs.expo.dev/versions/v57.0.0/

Özellikle `expo-file-system` SDK 54+ ile tamamen yenilendi — yeni `File`,
`Directory`, `Paths`, `DownloadTask` API'si kullan (`src/lib/updates.ts`
örnek). `getContentUriAsync` gibi eski fonksiyonlar yalnızca
`expo-file-system/legacy` altında mevcut.

## Teknoloji yığını

- Expo SDK 57, React Native 0.86, React 19, TypeScript
- Expo Router (`src/app` kök dizin), dosya tabanlı rotalar
- Zustand + AsyncStorage (kalıcı state: profil, favoriler, özel programlar,
  antrenman geçmişi, ayarlar)
- `lucide-react-native` ikonlar, `expo-image`, `expo-haptics`,
  `expo-keep-awake`, `react-native-svg` (grafikler)
- Google Barlow / Barlow Condensed fontları (`@expo-google-fonts/*`)
- Güncelleme: `expo-file-system` + `expo-intent-launcher` + `expo-device`

## Dizin yapısı

```
app/
  app.json                 # version + versionCode burada tutulur
  src/
    app/                   # Expo Router ekranları
      (tabs)/              # Ana Sayfa, Egzersizler, Programlar, Geçmiş, Profil
      onboarding.tsx       # ilk açılış sihirbazı
      builder.tsx          # özel program oluşturucu
      picker.tsx           # egzersiz seçici (builder'a döner)
      exercise/[id].tsx    # egzersiz detayı (GIF + TR adımlar)
      routine/[id].tsx     # program detayı
      session/[routineId].tsx  # antrenman oynatıcı (set/dinlenme sayacı)
      summary.tsx          # antrenman özeti
    components/            # ExerciseImage, ortak UI parçaları
    data/
      exercises.json       # 1.324 egzersiz (üretilmiş, elle düzenleme)
      exercises.ts         # tipler + isim formatlama (title-case, TR ekler)
      gifMap.ts, imgMap.ts # id -> require() eşlemesi (üretilmiş)
      labels.ts            # TR etiket çevirileri (kas grubu, ekipman, hedef)
      programs.ts          # 18 hazır program + öneri motoru
    lib/
      format.ts            # sayı/süre formatları
      updates.ts           # GitHub release kontrolü + APK indirme/kurma
    store/appStore.ts      # Zustand store (AsyncStorage persist)
    theme/index.ts         # renkler, fontlar, spacing — tek kaynak
  assets/exercises/        # 1.324 GIF + thumbnail (APK içine gömülü)
scripts/
  prepare-data.js          # dataset/ -> app-ready veri üretir
  release.sh               # sürüm bump + build + GitHub release
dataset/                   # ham veri seti (gitignore'da, indirilmeli)
```

## Derleme ve çalıştırma

```bash
cd app
npm install                # .npmrc'de legacy-peer-deps= true var, gerekli
npx tsc --noEmit           # typecheck — her değişiklikten sonra çalıştır
npx expo prebuild --platform android --no-install   # android/ üret
cd android && ./gradlew assembleRelease             # evrensel APK (4 ABI)
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a  # arm64 APK
```

Ortam gereksinimleri (bu makinede kurulu): JDK 17 (`/opt/homebrew/opt/openjdk@17`),
Android cmdline-tools (`/opt/homebrew/share/android-commandlinetools`),
`ANDROID_HOME` ve `JAVA_HOME` `release.sh` içinde export ediliyor.

- APK çıktısı: `app/android/app/build/outputs/apk/release/app-release.apk`
- İmzalama: debug keystore — **aynı anahtar kalmalı**, yoksa güncellemeler
  mevcut kurulumun üzerine yüklenemez.

## Dataset hattı

Kaynak: https://github.com/hasaneyldrm/exercises-dataset (~125MB, gitignore'da).
`node scripts/prepare-data.js` ham veriyi işler ve şunları **yeniden üretir**:
`src/data/exercises.json`, `gifMap.ts`, `imgMap.ts`, `assets/exercises/`.
Bu üretilmiş dosyaları elle düzenleme; scripti değiştir.

## Yayın akışı

```bash
./scripts/release.sh 1.1.0 "Sürüm notları"
```

Script şunları yapar: `version` bump + `versionCode++` → evrensel APK →
arm64 APK → commit + tag + push → `gh release create` (iki APK da yüklenir).

- Release adlandırması: `SporApp-v<semver>.apk` (evrensel) ve
  `SporApp-v<semver>-arm64.apk`. İsimlerdeki `arm64` dizesi updater'ın seçim
  mantığı tarafından kullanılır — **asset adlarını değiştirme**.
- `versionCode` her sürümde artmalı; Android aynı/düşük code'lu güncellemeyi
  reddeder.

## Uygulama içi güncelleme (`src/lib/updates.ts`)

- `api.github.com/repos/azygoss/sporapp/releases/latest` sorgulanır, semver
  karşılaştırılır.
- APK seçimi `expo-device` `supportedCpuArchitectures` ile ABI-aware:
  arm64 cihazda `*-arm64.apk`, diğerinde evrensel.
- İndirme `File.createDownloadTask` + `onProgress` ile cache'e yapılır;
  tamamlanan dosya AsyncStorage işaretiyle hatırlanır (tekrar indirilmez).
- Kurulum `IntentLauncher.startActivityAsync(VIEW)` +
  `getContentUriAsync` (FileProvider) ile açılır. Android kullanıcı onayı
  ister — sessiz kurulum mümkün değildir.
- Manifest'te `REQUEST_INSTALL_PACKAGES` izni zorunlu (app.json'da tanımlı,
  prebuild ile yansır).

## Kodlama kuralları

- **Kullanıcıya dönük tüm metinler Türkçe.** Dataset İngilizce/TR karışık —
  `data/labels.ts` üzerinden çevir; yeni kas/ekipman değeri eklersen
  çevirisini de ekle, çiğ İngilizce değer ekrana sızmasın.
- Egzersiz isimleri `exercises.ts` içinde formatlanır (title-case,
  `(male)`→`(Erkek)`, `v. 2`→`V2`). Yeni format kuralı oraya eklenir.
- Tema tek kaynak: `src/theme/index.ts` — renkleri hardcode etme.
- Tasarım dili: koyu arka plan, turuncu vurgu (`#F97316`), Barlow Condensed
  başlıklar. Placeholder/stub bırakma — her kontrol çalışır olmalı.
- `npm audit fix --force` çalıştırma (breaking değişiklik riski).

## Doğrulama

1. `cd app && npx tsc --noEmit` — temiz olmalı.
2. Release build: `cd app/android && ./gradlew assembleRelease`.
3. Emülatör: AVD `android-commandlinetools` altında; `adb install -r` ile kur,
   ekran görüntüsü + `input tap` ile akışları dene. Emülatör CPU'su arm64
   bildiriyor — arm64 APK kurulabilir.
4. Güncelleme akışını test etmek için kurulu sürüm < son release olmalı;
   yeni tag yayınlanınca Profil ekranından tetiklenebilir.

## Bilinen sınırlar / notlar

- APK ~176MB (arm64) / ~231MB (evrensel) — boyut 1.324 gömülü GIF'ten gelir,
  bilinçli tercih (tam çevrimdışı medya).
- `app/android/` gitignore'da; prebuild ile yeniden üretilir. Manifest
  değişikliklerini `app.json` üzerinden yap.
- Repo public olmalı — release asset'leri anonim indirilebilmeli (updater
  auth kullanmıyor).
