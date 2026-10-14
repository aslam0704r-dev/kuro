/* Pure installation decisions, shared by the popup and regression tests. */
export function detectPlatform(nav = {}) {
  const ua = String(nav.userAgent || '');
  if (/Windows Phone/i.test(ua)) return 'other';
  if (/iPhone|iPad|iPod/i.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) return 'ios';
  const hint = String(nav.userAgentData?.platform || '').toLowerCase();
  if (hint === 'android' || /Android/i.test(ua)) return 'android';
  if (hint === 'windows' || /Windows NT/i.test(ua) || /^Win/.test(String(nav.platform || ''))) return 'windows';
  return 'other';
}
export function validRelease(value) {
  if (!value || Array.isArray(value) || value.schema !== 1 || typeof value.version !== 'string' || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(value.version)) return null;
  const result = { version: value.version };
  for (const platform of ['android', 'windows']) {
    const item = value[platform], suffix = platform === 'android' ? 'apk' : 'exe';
    if (!item || typeof item.url !== 'string' || !new RegExp('^/downloads/[A-Za-z0-9_-][A-Za-z0-9._-]{0,150}\\.' + suffix + '$').test(item.url) ||
        !Number.isSafeInteger(item.bytes) || item.bytes <= 0 || item.bytes > 500 * 1024 * 1024 ||
        typeof item.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(item.sha256) ||
        typeof item.minimumSystem !== 'string' || !/^[A-Za-z0-9 +/().-]{1,70}$/.test(item.minimumSystem)) continue;
    result[platform] = { url: item.url, bytes: item.bytes, sha256: item.sha256.toLowerCase(), minimumSystem: item.minimumSystem };
  }
  return result;
}
export function nativeEntry(search = '') {
  return ['android', 'windows'].includes(new URLSearchParams(search).get('kuro-native'));
}
