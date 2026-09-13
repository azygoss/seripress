import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

const REPO = 'azygoss/seripress';
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

const FLAG_GRANT_READ_URI_PERMISSION = 0x00000001;
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

export interface UpdateInfo {
  status: 'current' | 'available' | 'error';
  version?: string;
  notes?: string;
  url?: string;
  pageUrl?: string;
}

export function currentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetch(API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { status: 'error' };
    const rel = await res.json();
    const latest = String(rel.tag_name ?? '').replace(/^v/i, '');
    if (compareVersions(latest, currentVersion()) <= 0) return { status: 'current' };
    const apks = (rel.assets ?? []).filter(
      (a: { name?: string; browser_download_url?: string }) => a.name?.endsWith('.apk')
    );
    const wantsArm64 =
      Platform.OS === 'android' &&
      (Device.supportedCpuArchitectures ?? []).some((a) => a.includes('arm64'));
    const arm64Apk = apks.find((a: { name?: string }) => a.name?.includes('arm64'));
    const apk =
      (wantsArm64 ? arm64Apk : apks.find((a: { name?: string }) => !a.name?.includes('arm64'))) ?? apks[0];
    return {
      status: 'available',
      version: latest,
      notes: typeof rel.body === 'string' ? rel.body.trim() : '',
      url: apk?.browser_download_url ?? rel.html_url,
      pageUrl: rel.html_url,
    };
  } catch {
    return { status: 'error' };
  }
}

export interface InstallResult {
  status: 'prompted' | 'error';
  error?: string;
}

export async function downloadAndInstall(
  url: string,
  version: string,
  onProgress?: (percent: number) => void
): Promise<InstallResult> {
  try {
    const dest = new File(Paths.cache, `sporapp-update-${version}.apk`);
    const doneKey = `sporapp.apk.${version}`;
    const alreadyDownloaded =
      dest.exists && (await AsyncStorage.getItem(doneKey)) === '1';
    if (!alreadyDownloaded) {
      if (dest.exists) dest.delete();
      const task = File.createDownloadTask(url, dest, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) {
            onProgress?.(Math.min(99, Math.round((bytesWritten / totalBytes) * 100)));
          }
        },
      });
      const file = await task.downloadAsync();
      if (!file) return { status: 'error', error: 'İndirme tamamlanamadı.' };
      await AsyncStorage.setItem(doneKey, '1');
    }
    onProgress?.(100);
    if (Platform.OS !== 'android') {
      return { status: 'error', error: 'Kurulum yalnızca Android cihazlarda destekleniyor.' };
    }
    const contentUri = await getContentUriAsync(dest.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
    });
    return { status: 'prompted' };
  } catch {
    return { status: 'error', error: 'İndirme veya kurulum başlatılamadı.' };
  }
}
