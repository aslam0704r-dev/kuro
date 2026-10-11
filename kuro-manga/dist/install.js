(() => {
  const installed = () => (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
  if (installed()) return;
  let offer = null, dialog = null, previousFocus = null, backdrop = null, fallback = false, timer;
  const key = 'kuro-install-dismissed';
  const dismissed = () => {
    try { const elapsed = Date.now() - Number(localStorage.getItem(key) || 0); return elapsed >= 0 && elapsed < 7 * 86400000; }
    catch { return false; }
  };
  function close() {
    if (dialog?.hasAttribute('open')) {
      if (!fallback && typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    backdrop?.remove(); backdrop = null; previousFocus?.focus?.();
  }
  function defer() {
    try { localStorage.setItem(key, String(Date.now())); } catch {}
    close();
  }
  function focusable() { return [...dialog.querySelectorAll('button, a[href], [tabindex="0"]')].filter(element => !element.disabled); }
  function open() {
    if (!dialog.hasAttribute('open')) {
      previousFocus = document.activeElement;
      if (typeof dialog.showModal === 'function') {
        try { dialog.showModal(); fallback = false; }
        catch { fallback = true; }
      } else fallback = true;
      if (fallback) {
        dialog.setAttribute('data-fallback', 'true');
        backdrop = document.createElement('div'); backdrop.id = 'kuro-install-backdrop';
        backdrop.addEventListener('click', defer); document.body.append(backdrop);
        dialog.setAttribute('open', '');
      }
    }
    focusable()[0]?.focus();
  }
  function show(force = false) {
    if (installed() || (!force && dismissed()) || location.pathname.startsWith('/reader/') || location.pathname.startsWith('/auth/')) return;
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'kuro-install';
      dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'kuro-install-title'); dialog.setAttribute('aria-describedby', 'kuro-install-info');
      dialog.innerHTML = '<img src="/icons/kuro-192.png" alt=""><h2 id="kuro-install-title">Keep KURO close.</h2><p id="kuro-install-info"></p><section id="kuro-install-help" aria-label="Installation steps" hidden><h3>Installation steps</h3><p></p></section><div class="actions"></div><small>Free web-app installation. Internet is needed to load stories. No APK or app-store download.</small>';
      dialog.addEventListener('cancel', event => { event.preventDefault(); defer(); });
      dialog.addEventListener('keydown', event => {
        if (!fallback) return;
        if (event.key === 'Escape') { event.preventDefault(); defer(); }
        if (event.key === 'Tab') {
          const elements = focusable(), first = elements[0], last = elements[elements.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      });
      document.body.append(dialog);
    }
    const text = dialog.querySelector('#kuro-install-info'), help = dialog.querySelector('#kuro-install-help'), actions = dialog.querySelector('.actions');
    help.hidden = true; actions.replaceChildren();
    if (window.top !== window.self) {
      text.textContent = 'Open KURO in its own browser tab to install it on your computer or Android phone.';
      const link = document.createElement('a'); link.href = location.href; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open KURO'; actions.append(link);
    } else {
      text.textContent = offer ? 'Install KURO for a dedicated window and an icon on your home screen or desktop.'
        : 'Install KURO on your home screen or desktop. The button below opens your browser’s installer when available, or shows the steps for your device.';
      const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      help.querySelector('p').textContent = appleMobile
        ? 'Open KURO in Safari. Tap Share → Add to Home Screen → Add. If KURO is already installed, open it from your home screen.'
        : /Android/i.test(navigator.userAgent)
          ? 'In Chrome, open ⋮ → Add to Home screen → Install, then confirm. If KURO is already installed, open it from your home screen or app list.'
          : /Edg\//.test(navigator.userAgent)
            ? 'If Edge offers Open in app, use it. To install KURO, select the App available icon in the address bar and choose Install. You can also look for the installation option in Edge’s Apps menu.'
            : /Chrome|Chromium/.test(navigator.userAgent)
              ? 'If Chrome shows Open in app in the address bar, choose it: KURO is already installed. Otherwise, open ⋮ → Cast, save and share → Install page as app, then follow Chrome’s instructions. You can also use an install icon in the address bar if offered.'
              : 'Use your browser’s installation or Add to Home Screen menu option. If it is unavailable, open KURO in an updated Chrome or Edge. If KURO is already installed, launch it from your apps list.';
      const button = document.createElement('button'); button.className = 'primary'; button.textContent = 'Install KURO';
      button.setAttribute('aria-controls', 'kuro-install-help'); button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', async () => {
        const pending = offer; clearTimeout(timer);
        if (!pending) {
          help.hidden = !help.hidden;
          button.textContent = help.hidden ? 'Install KURO' : 'Hide instructions';
          button.setAttribute('aria-expanded', String(!help.hidden));
          return;
        }
        button.disabled = true;
        try {
          await pending.prompt(); const result = await pending.userChoice; offer = null;
          if (result.outcome === 'dismissed') defer(); else close();
        } catch { offer = null; show(true); }
        finally { button.disabled = false; }
      });
      actions.append(button);
    }
    const later = document.createElement('button'); later.textContent = 'Not now'; later.addEventListener('click', defer); actions.append(later);
    open();
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); offer = event; clearTimeout(timer); timer = setTimeout(show, 1200); });
  window.addEventListener('appinstalled', () => { offer = null; clearTimeout(timer); close(); dialog?.remove(); });
  window.addEventListener('kuro-install', () => { try { localStorage.removeItem(key); } catch {} show(true); });
  timer = setTimeout(show, 3500);
})();
