export function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function fmtDate(ts: number, lang: 'tr' | 'en' = 'tr'): string {
  const d = new Date(ts);
  const months =
    lang === 'en'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return lang === 'en'
    ? `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function relDay(ts: number, lang: 'tr' | 'en' = 'tr'): string {
  const now = new Date();
  const d = new Date(ts);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(now, d)) return lang === 'en' ? 'Today' : 'Bugün';
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (same(y, d)) return lang === 'en' ? 'Yesterday' : 'Dün';
  return fmtDate(ts, lang);
}
