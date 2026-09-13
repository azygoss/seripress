import Constants from 'expo-constants';

const REPO = 'azygoss/sporapp';
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

export interface UpdateInfo {
  status: 'current' | 'available' | 'error';
  version?: string;
  notes?: string;
  url?: string;
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
    const apk = (rel.assets ?? []).find((a: { name?: string; browser_download_url?: string }) =>
      a.name?.endsWith('.apk')
    );
    return {
      status: 'available',
      version: latest,
      notes: typeof rel.body === 'string' ? rel.body.trim() : '',
      url: apk?.browser_download_url ?? rel.html_url,
    };
  } catch {
    return { status: 'error' };
  }
}
