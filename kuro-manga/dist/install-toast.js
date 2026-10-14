import { detectPlatform, validRelease, nativeEntry } from './install-model.mjs';
(() => {
  const installed = () => (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const inNative = nativeEntry(location.search), platform = detectPlatform(navigator), key = 'kuro-install-dismissed';
  let offer = null, notice = null, previousFocus = null, timer = null, showGeneration = 0;
  let currentLocation = location.href;
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
  const blockedRoute = () => location.pathname.startsWith('/reader/') || location.pathname.startsWith('/auth/');
  const dismissed = () => {
    try { const elapsed = Date.now() - Number(localStorage.getItem(key) || 0); return elapsed >= 0 && elapsed < 7 * 86400000; } catch { return false; }
  };
  async function fetchTimed(url, options = {}, read = response => response) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
    try { return await read(await fetch(url, { cache: 'no-store', credentials: 'omit', ...options, signal: controller.signal })); }
    finally { clearTimeout(timeout); }
  }
  const downloads = (async () => {
    try {
      const value = await fetchTimed('/downloads/releases.json', {}, response => response.ok && /json/i.test(response.headers.get('content-type') || '') ? response.json() : null);
      const release = validRelease(value); if (!release) return null;
      // Only the current system's file needs probing for this notice.
      const file = release[platform];
      if (file) {
        try {
          const probe = await fetchTimed(file.url, { method: 'HEAD' });
          const type = (probe.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
          const allowed = platform === 'android' ? ['application/vnd.android.package-archive', 'application/octet-stream']
            : ['application/vnd.microsoft.portable-executable', 'application/x-msdownload', 'application/octet-stream'];
          if (!probe.ok || !allowed.includes(type) || Number(probe.headers.get('content-length')) !== file.bytes) delete release[platform];
        } catch { delete release[platform]; }
      }
      return release;
    } catch { return null; }
  })();
  function element(tag, attributes = {}, text) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const announcement = element('span', { id: 'kuro-install-announcement', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  document.body.append(announcement);
  function close() {
    showGeneration++;
    if (!notice) return;
    const restore = notice.contains(document.activeElement);
    notice.hidden = true; notice.getAnimations?.().forEach(animation => animation.cancel());
    announcement.textContent = '';
    if (restore && previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
  }
  function defer() { clearTimeout(timer); try { localStorage.setItem(key, String(Date.now())); } catch {} close(); }
  function position() {
    if (currentLocation !== location.href) { currentLocation = location.href; showGeneration++; }
    if (notice) notice.dataset.navigation = location.pathname.replace(/\/+$/, '') === '/account' ? 'false' : 'true';
    if (blockedRoute()) close();
  }
  function build() {
    notice = element('aside', { id: 'kuro-install', role: 'region', 'aria-labelledby': 'kuro-install-title' }); notice.hidden = true;
    const icon = element('img', { src: '/icons/kuro-192.png', alt: '', width: '36', height: '36' });
    const heading = element('div', { class: 'kuro-install-copy' });
    heading.append(element('h2', { id: 'kuro-install-title' }, 'Install KURO'), element('p', { id: 'kuro-install-info' }));
    const dismiss = element('button', { type: 'button', class: 'kuro-install-close', 'aria-label': 'Dismiss install notification' }, '×'); dismiss.addEventListener('click', defer);
    const header = element('div', { class: 'kuro-install-header' }); header.append(icon, heading, dismiss);
    const help = element('p', { id: 'kuro-install-help', role: 'status', 'aria-live': 'polite' }); help.hidden = true;
    notice.append(header, help, element('div', { class: 'kuro-install-actions' }));
    notice.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); defer(); } });
    document.body.append(notice);
  }
  function help(text) { const node = notice.querySelector('#kuro-install-help'); node.textContent = text; node.hidden = false; }
  function browserInstructions() {
    if (platform === 'ios') return 'In Safari, tap Share → Add to Home Screen → Add.';
    if (platform === 'android') return 'In Chrome, open ⋮ → Add to Home screen → Install.';
    if (/Edg\//.test(navigator.userAgent)) return 'In Edge, choose the app icon or Apps → Install this site. If you see Open in app, KURO is already installed.';
    if (/Chrome|Chromium/.test(navigator.userAgent)) return 'In Chrome, choose ⋮ → Cast, save and share → Install page as app. If you see Open in app, KURO is already installed.';
    return 'Use your browser’s Install or Add to Home Screen option, or open KURO in Chrome or Edge.';
  }
  async function browserInstall(button) {
    clearTimeout(timer);
    const pending = offer;
    if (!pending) { help(browserInstructions()); return; }
    button.disabled = true;
    try {
      await pending.prompt(); const result = await pending.userChoice; offer = null;
      if (result.outcome === 'dismissed') defer(); else close();
    } catch { offer = null; help(browserInstructions()); }
    finally { button.disabled = false; }
  }
  async function show(force = false) {
    if ((!force && (installed() || inNative || dismissed())) || blockedRoute()) return;
    const epoch = ++showGeneration, release = await downloads;
    if (epoch !== showGeneration || (!force && (installed() || inNative || dismissed())) || blockedRoute()) return;
    if (!notice) build();
    if (notice.hidden && !notice.contains(document.activeElement)) previousFocus = document.activeElement;
    const info = notice.querySelector('#kuro-install-info'), actions = notice.querySelector('.kuro-install-actions');
    actions.replaceChildren(); notice.querySelector('#kuro-install-help').hidden = true;
    let primary;
    if (window.top !== window.self) {
      info.textContent = 'Open KURO to install it on this device.';
      primary = element('a', { id: 'kuro-install-action', class: 'primary', href: location.href, target: '_blank', rel: 'noopener' }, 'Install');
    } else {
      const file = release?.[platform];
      if (file) {
        info.textContent = file.minimumSystem;
        primary = element('a', { id: 'kuro-install-action', class: 'primary', href: file.url, download: file.url.split('/').pop(), 'aria-label': platform === 'android' ? 'Install KURO for Android' : 'Install KURO for Windows' }, 'Install');
        primary.addEventListener('click', () => {
          clearTimeout(timer);
          help(platform === 'android' ? 'Open the APK download, then confirm Install in Android.' : 'Open the download, then choose Install. Windows may show an unknown publisher warning.');
        });
        const browser = element('button', { type: 'button', class: 'kuro-install-secondary', 'aria-label': 'Install KURO in your browser' }, 'Browser install');
        browser.addEventListener('click', () => browserInstall(browser)); actions.append(browser);
      } else {
        info.textContent = platform === 'ios' ? 'Add KURO to your home screen.' : 'Keep KURO in your apps.';
        primary = element('button', { id: 'kuro-install-action', type: 'button', class: 'primary' }, 'Install');
        primary.addEventListener('click', () => browserInstall(primary));
      }
    }
    const later = element('button', { type: 'button', class: 'kuro-install-secondary' }, 'Later'); later.addEventListener('click', defer);
    actions.append(later, primary); position();
    const wasHidden = notice.hidden; notice.hidden = false;
    if (wasHidden && !force) announcement.textContent = 'Install KURO. ' + info.textContent;
    // An automatic notification never interrupts typing or moves page focus.
    if (force) primary.focus({ preventScroll: true });
  }
  document.addEventListener('focusin', event => { if (notice && !notice.hidden && !notice.contains(event.target)) previousFocus = event.target; });
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method]; history[method] = function(...args) { const result = original.apply(this, args); position(); return result; };
  }
  addEventListener('popstate', position);
  addEventListener('hashchange', position);
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); offer = event; clearTimeout(timer);
    // Existing controls read the current offer when clicked; rebuilding a
    // visible notice would unnecessarily remove the user's focused control.
    if (!notice || notice.hidden) timer = setTimeout(() => show(), 1200);
  });
  addEventListener('appinstalled', () => { offer = null; clearTimeout(timer); close(); notice?.remove(); notice = null; });
  addEventListener('kuro-install', () => { try { localStorage.removeItem(key); } catch {} show(true); });
  timer = setTimeout(() => show(), 3500);
})();
