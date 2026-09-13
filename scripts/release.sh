#!/usr/bin/env bash
# Yeni sürüm yayınla: ./scripts/release.sh 1.1.0 "Sürüm notları"
set -euo pipefail

VERSION="${1:?Kullanım: ./scripts/release.sh <semver> \"sürüm notları\"}"
NOTES="${2:-SporApp v$VERSION}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"

# version + versionCode bump
node - "$ROOT" "$VERSION" <<'EOF'
const fs = require('fs');
const [root, version] = process.argv.slice(2);
const appJson = JSON.parse(fs.readFileSync(`${root}/app/app.json`, 'utf8'));
const oldCode = appJson.expo.android.versionCode;
appJson.expo.version = version;
appJson.expo.android.versionCode = oldCode + 1;
fs.writeFileSync(`${root}/app/app.json`, JSON.stringify(appJson, null, 2) + '\n');
const pkg = JSON.parse(fs.readFileSync(`${root}/app/package.json`, 'utf8'));
pkg.version = version;
fs.writeFileSync(`${root}/app/package.json`, JSON.stringify(pkg, null, 2) + '\n');
console.log(`version: ${version}, versionCode: ${oldCode} -> ${oldCode + 1}`);
EOF

# build release APK — önce evrensel (4 ABI), sonra arm64-only (daha küçük, çoğu cihaz)
cd "$ROOT/app/android"
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk "$ROOT/SporApp-v$VERSION.apk"
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cp app/build/outputs/apk/release/app-release.apk "$ROOT/SporApp-v$VERSION-arm64.apk"
cd "$ROOT"

# tag + release
git add app/app.json app/package.json
git commit -m "Sürüm v$VERSION" || true
git tag -a "v$VERSION" -m "SporApp v$VERSION"
git push origin HEAD --tags
gh release create "v$VERSION" \
  "SporApp-v$VERSION-arm64.apk" \
  "SporApp-v$VERSION.apk" \
  --title "SporApp v$VERSION" --notes "$NOTES"

echo "Yayınlandı: https://github.com/azygoss/sporapp/releases/tag/v$VERSION"
