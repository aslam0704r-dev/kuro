/* Source for KURO's account editor. No credentials or private URLs are persisted. */
(() => {
  'use strict';
  if (window.__kuroProfileEditor) return;
  window.__kuroProfileEditor = true;
  const nativeFetch = window.fetch.bind(window);
  let profile = null, launch = null, dialog = null, selected = null, preview = '', busy = false;
  let generation = 0, pending = null, timer = null, reloadOnClose = false, revision = Date.now();
  let closing = false, pointerFrame = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set(), effectTimers = new Set();
  const onAccount = () => location.pathname.replace(/\/+$/, '') === '/account';
  const byId = id => dialog?.querySelector('#' + id);
  function element(tag, attributes = {}, text) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function clearSelection(resetInput = true) {
    selected = null;
    if (preview) URL.revokeObjectURL(preview);
    preview = '';
    if (resetInput && byId('kuro-profile-file')) byId('kuro-profile-file').value = '';
  }
  function animate(node, frames, options = {}) {
    if (!node || reducedMotion.matches || !node.animate) return null;
    const animation = node.animate(frames, { duration: 420, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'both', ...options });
    animations.add(animation);
    animation.finished.then(() => { animation.cancel(); animations.delete(animation); }).catch(() => animations.delete(animation));
    return animation;
  }
  function stopMotion() {
    for (const animation of animations) animation.cancel();
    animations.clear(); cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    for (const id of effectTimers) clearTimeout(id);
    effectTimers.clear();
    dialog?.querySelectorAll('.kuro-profile-fleck,.kuro-profile-ripple').forEach(node => node.remove());
  }
  function removeEffect(node, duration = 950) {
    const id = setTimeout(() => { node.remove(); effectTimers.delete(id); }, duration);
    effectTimers.add(id);
  }
  function reveal() {
    stopMotion();
    animate(dialog, [{ opacity: 0, transform: 'translateY(34px) scale(.95)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 500 });
    animate(dialog?.querySelector('.kuro-profile-hero-plane'), [{ opacity: 0, transform: 'translateX(-30px) scale(.98)' }, { opacity: 1, transform: 'translateX(0) scale(1)' }], { duration: 580, delay: 70 });
    animate(dialog?.querySelector('.kuro-profile-portrait'), [{ transform: 'translateY(32px) rotate(-14deg) scale(.8)', opacity: 0 }, { transform: 'translateY(0) rotate(-5deg) scale(1)', opacity: 1 }], { duration: 700, delay: 90, easing: 'cubic-bezier(.16,1,.3,1)' });
    dialog?.querySelectorAll('.kuro-profile-workspace > *').forEach((node, index) => {
      animate(node, [{ opacity: 0, transform: 'translateY(13px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: 100 + index * 65, duration: 450 });
    });
  }
  function celebrate() {
    if (reducedMotion.matches || !dialog?.open || document.hidden) return;
    const stage = dialog.querySelector('.kuro-profile-avatar-stage');
    animate(stage, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: .35 }, { transform: 'scale(1)' }], { duration: 600 });
    const flare = dialog.querySelector('.kuro-profile-flare');
    animate(flare, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: .7, offset: .25 }, { opacity: 0, transform: 'scale(1.35)' }], { duration: 800 });
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6, fleck = element('span', { class: 'kuro-profile-fleck', 'aria-hidden': 'true' });
      fleck.style.setProperty('--fx-x', Math.cos(angle) * 120 + 'px');
      fleck.style.setProperty('--fx-y', Math.sin(angle) * 120 + 'px');
      fleck.style.setProperty('--fx-turn', index * 53 + 'deg');
      stage.append(fleck); removeEffect(fleck);
    }
  }
  function status(message, error = false, kind = '') {
    const node = byId('kuro-profile-status');
    if (node) {
      const state = kind || (error ? 'error' : busy ? 'loading' : message ? 'info' : 'idle');
      node.textContent = message || 'Save when you’re ready.'; node.classList.toggle('is-error', error);
      dialog.dataset.feedback = state;
      if (state === 'success') celebrate();
      if (state === 'error') animate(dialog.querySelector('.kuro-profile-workspace'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 250 });
    }
  }
  async function close(force = false) {
    const target = dialog;
    if (closing && !force) return;
    if (target?.open) {
      closing = true; target.classList.add('is-closing'); stopMotion();
      if (!force && !reducedMotion.matches) {
        const exit = animate(target, [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(18px) scale(.97)' }], { duration: 220 });
        if (exit) await exit.finished.catch(() => {});
      }
      if (target !== dialog) return;
      if (typeof target.close === 'function') target.close(); else target.removeAttribute('open');
      target.classList.remove('is-closing');
    }
    closing = false; clearSelection();
    launch?.focus();
    if (!force && reloadOnClose && onAccount()) location.reload();
  }
  function clear() {
    generation++; pending?.abort(); pending = null; clearSelection(); close(true); stopMotion();
    launch?.remove(); dialog?.remove(); launch = dialog = null; profile = null; busy = reloadOnClose = false;
  }
  function initials() { return [...(profile?.name || 'Reader')].slice(0, 1).join('').toUpperCase(); }
  function updatePictures() {
    if (!dialog || !launch) return;
    // The UID only separates browser image cache entries. The server still
    // derives ownership exclusively from the verified session.
    const savedSource = profile.hasAvatar ? '/api/profile/avatar?u=' + encodeURIComponent(profile.id) + '&v=' + revision : '';
    for (const [image, fallback, source] of [
      [launch.querySelector('img'), launch.querySelector('.kuro-profile-initial'), savedSource],
      [byId('kuro-profile-picture'), byId('kuro-profile-initial'), preview || savedSource],
      [byId('kuro-profile-hero-picture'), byId('kuro-profile-hero-initial'), preview || savedSource]
    ]) {
      fallback.textContent = initials(); fallback.hidden = !!source; image.hidden = !source;
      image.onerror = () => { image.hidden = true; fallback.hidden = false; };
      image.onload = () => { if (dialog?.open && !closing) animate(image, [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300 }); };
      if (source && image.getAttribute('src') !== source) image.src = source;
      else if (!source) image.removeAttribute('src');
    }
    byId('kuro-profile-upload').disabled = busy || !selected;
    byId('kuro-profile-remove').disabled = busy || !profile.hasAvatar;
    byId('kuro-profile-cancel-picture').hidden = !selected;
    byId('kuro-profile-file-name').textContent = selected ? selected.name.slice(0, 100) : 'Choose profile picture';
    byId('kuro-profile-picture-state').textContent = selected ? 'Unsaved preview' : 'Private picture';
    dialog.classList.toggle('is-previewing', !!selected);
  }
  function updateLiveName() {
    const input = byId('kuro-profile-display-name'); if (!input) return;
    const name = input.value.normalize('NFC').trim(), count = [...name].length;
    byId('kuro-profile-live-name').textContent = name || 'Your next chapter';
    byId('kuro-profile-live-name').classList.toggle('is-long-name', count > 24);
    byId('kuro-profile-name-count').textContent = count + ' / 60';
    input.setAttribute('aria-invalid', String(count > 60 || (count > 0 && count < 2) || /[\p{Cc}\p{Cf}]/u.test(name)));
    if (!profile.hasAvatar && !preview) byId('kuro-profile-hero-initial').textContent = [...(name || 'Reader')][0].toUpperCase();
  }
  function render(setInput = false) {
    if (!profile || !launch || !dialog) return;
    launch.querySelector('#kuro-profile-name').textContent = profile.name;
    if (setInput) byId('kuro-profile-display-name').value = profile.name;
    updatePictures(); updateLiveName();
  }
  function setBusy(value) {
    busy = value;
    dialog?.setAttribute('aria-busy', String(value));
    dialog?.classList.toggle('is-saving', value);
    dialog?.querySelector('.kuro-profile-dropzone')?.setAttribute('aria-disabled', String(value));
    for (const id of ['kuro-profile-save-name', 'kuro-profile-display-name', 'kuro-profile-file']) if (byId(id)) byId(id).disabled = value;
    updatePictures();
  }
  async function request(path, options = {}, controller) {
    const own = controller || new AbortController();
    const timeout = setTimeout(() => own.abort(), 25000);
    try {
      const response = await nativeFetch(path, { ...options, credentials: 'same-origin', cache: 'no-store', signal: own.signal });
      const data = await response.json().catch(error => { if (error.name === 'AbortError') throw error; return {}; });
      if (!response.ok) throw Object.assign(new Error(data.error || 'Profile service is unavailable. Please retry.'), { status: response.status });
      return data;
    } finally { clearTimeout(timeout); }
  }
  async function refresh(open = false) {
    if (!onAccount()) { clear(); return; }
    if (busy || closing) return;
    const epoch = ++generation;
    pending?.abort(); const controller = new AbortController(); pending = controller;
    try {
      const value = await request('/api/profile', {}, controller);
      if (epoch !== generation || !onAccount()) return;
      if (!value.id || typeof value.name !== 'string') throw new Error('Profile response was invalid.');
      if (profile && profile.id !== value.id) {
        clear(); location.reload(); return;
      }
      profile = value;
      if (!launch) build();
      render(open || !dialog.open);
      if (open && !dialog.open) {
        status(''); clearSelection(); render(true);
        if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
        reveal();
        (finePointer.matches ? byId('kuro-profile-display-name') : dialog.querySelector('.kuro-profile-close')).focus({ preventScroll: true });
      }
    } catch (error) {
      if (epoch !== generation || error.name === 'AbortError') return;
      if ([401, 403].includes(error.status)) clear();
      else if (open) status(error.message || 'Could not load your profile.', true);
    } finally { if (epoch === generation) pending = null; }
  }
  async function mutate(path, method, body, type, success, isName = false) {
    if (busy || !profile) return;
    pending?.abort();
    const id = profile.id, epoch = ++generation;
    const controller = new AbortController(); pending = controller;
    dialog.dataset.action = isName ? 'name' : method === 'DELETE' ? 'remove' : 'upload';
    setBusy(true); status('Saving…');
    try {
      const headers = { 'Content-Type': type, 'X-Kuro-User': id };
      if (body instanceof Blob) { headers['Content-Type'] = 'application/octet-stream'; headers['X-Kuro-Image-Type'] = type; }
      const value = await request(path, { method, headers, body }, controller);
      if (epoch !== generation || !onAccount() || profile?.id !== id) return;
      if (value.id !== id) throw new Error('Your account changed. Reload the page and try again.');
      profile = value; revision = Date.now(); clearSelection(); render(isName);
      reloadOnClose ||= isName;
      status(value.warning || success, false, value.warning ? 'warning' : 'success');
    } catch (error) {
      if (epoch !== generation) return;
      if (error.name === 'AbortError') { status('The save could not be confirmed. Reload your profile before trying again.', true); return; }
      status(error.message || 'Could not save your profile. Please retry.', true);
      if ([401, 403, 409].includes(error.status)) { clear(); schedule(); }
    } finally { if (epoch === generation) { pending = null; setBusy(false); } }
  }
  function build() {
    launch = element('button', { id: 'kuro-profile-launch', type: 'button', 'aria-haspopup': 'dialog', 'aria-label': 'Edit profile' });
    const avatar = element('span', { class: 'kuro-profile-mini' });
    avatar.append(element('img', { alt: '' }), element('span', { class: 'kuro-profile-initial' }));
    const words = element('span', { class: 'kuro-profile-launch-copy' });
    words.append(element('span', { id: 'kuro-profile-name' }), element('span', { class: 'kuro-profile-edit-label' }, 'Edit profile'));
    launch.append(avatar, words, element('span', { 'aria-hidden': 'true', class: 'kuro-profile-arrow' }, '↗'));
    launch.addEventListener('click', () => refresh(true));
    dialog = element('dialog', { id: 'kuro-profile-dialog', 'aria-labelledby': 'kuro-profile-title', 'aria-modal': 'true' });
    // This template is fixed application markup. User data is set through value/textContent only.
    const camera = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l1.5-2h5L16 5h4a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"/><circle cx="12" cy="12" r="4"/></svg>';
    const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6l6 6-6 6"/></svg>';
    dialog.innerHTML = [
      '<div class="kuro-profile-chrome"><div class="kuro-profile-brand">KURO<span>Account studio</span></div><button type="button" class="kuro-profile-close" aria-label="Close profile editor"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>',
      '<div class="kuro-profile-shell"><section class="kuro-profile-hero" aria-label="Live profile preview"><span class="kuro-profile-curtain kuro-profile-curtain-left" aria-hidden="true"></span><span class="kuro-profile-curtain kuro-profile-curtain-right" aria-hidden="true"></span><div class="kuro-profile-hero-plane"><div class="kuro-profile-aura" aria-hidden="true"></div><div class="kuro-profile-halftone" aria-hidden="true"></div><div class="kuro-profile-hero-caption"><span>Your reader card</span><span class="kuro-profile-card-mark" aria-hidden="true">✦</span></div>',
      '<div class="kuro-profile-avatar-stage"><span class="kuro-profile-orbit" aria-hidden="true"><i></i></span><span class="kuro-profile-orbit kuro-profile-orbit-inner" aria-hidden="true"><i></i></span><span class="kuro-profile-flare" aria-hidden="true"></span><div class="kuro-profile-portrait"><img id="kuro-profile-hero-picture" alt="Your profile picture"><span id="kuro-profile-hero-initial" aria-hidden="true"></span></div><span class="kuro-profile-avatar-caption" aria-hidden="true">THE STORY HOUSE</span></div>',
      '<div class="kuro-profile-live-copy"><span class="kuro-profile-live-label">Your name. Your story.</span><h3 id="kuro-profile-live-name"></h3><p>A little more you.<br>A thousand stories ahead.</p></div><div class="kuro-profile-hero-footer"><span>Made for your next chapter.</span><span aria-hidden="true">K /</span></div><div class="kuro-profile-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></section>',
      '<section class="kuro-profile-workspace" aria-label="Profile settings"><header class="kuro-profile-heading"><h2 id="kuro-profile-title">Edit profile</h2><p>Make your account feel like you.</p></header><div class="kuro-profile-picture-block"><div class="kuro-profile-section-label"><span>Profile picture</span><span id="kuro-profile-picture-state">Private picture</span></div>',
      '<label class="kuro-profile-dropzone" for="kuro-profile-file" role="button" tabindex="0" aria-label="Browse for a picture"><span class="kuro-profile-photo"><img id="kuro-profile-picture" alt=""><span id="kuro-profile-initial" aria-hidden="true"></span><span class="kuro-profile-camera">' + camera + '</span></span><span class="kuro-profile-drop-copy"><strong id="kuro-profile-file-name">Choose profile picture</strong><span>or drag an image here</span><small>JPEG, PNG or WebP · up to 1 MiB</small></span></label><input id="kuro-profile-file" class="kuro-profile-file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile picture" tabindex="-1"><p class="kuro-profile-hint">Static pictures, up to 4096 × 4096 pixels.</p>',
      '<div class="kuro-profile-photo-actions"><button id="kuro-profile-upload" type="button"><span>Upload picture</span>' + arrow + '</button><button id="kuro-profile-remove" type="button" class="kuro-profile-secondary">Remove picture</button><button id="kuro-profile-cancel-picture" type="button" class="kuro-profile-secondary" hidden>Cancel preview</button></div></div>',
      '<form id="kuro-profile-name-form"><div class="kuro-profile-name-label"><label for="kuro-profile-display-name">Display name</label><span id="kuro-profile-name-count">0 / 60</span></div><div class="kuro-profile-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0116 0v2"/></svg><input id="kuro-profile-display-name" type="text" autocomplete="nickname" aria-describedby="kuro-profile-name-hint" required></div><span id="kuro-profile-name-hint" class="kuro-profile-hint">2–60 visible characters. Preview changes as you type.</span><button id="kuro-profile-save-name" type="submit"><span>Save name</span>' + arrow + '</button></form>',
      '<div class="kuro-profile-feedback"><span class="kuro-profile-feedback-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12l4 4L19 6"/></svg></span><p id="kuro-profile-status" role="status" aria-live="polite">Save when you’re ready.</p></div></section></div>'
    ].join('');
    dialog.querySelector('.kuro-profile-close').addEventListener('click', () => close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button,input,[tabindex="0"]')].filter(n => !n.disabled && !n.hidden && n.tabIndex >= 0 && n.offsetParent !== null);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    document.body.append(launch, dialog);
    function chooseFile(file) {
      if (busy || closing) return;
      clearSelection(false);
      if (!file) { updatePictures(); return; }
      if (file.size > 1048576 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        byId('kuro-profile-file').value = '';
        status('Choose a JPEG, PNG or WebP file of 1 MiB or smaller.', true); updatePictures(); return;
      }
      selected = file; preview = URL.createObjectURL(file); updatePictures(); status('Preview ready. Press Upload picture to save it.');
    }
    byId('kuro-profile-file').addEventListener('change', () => chooseFile(byId('kuro-profile-file').files?.[0]));
    const dropzone = dialog.querySelector('.kuro-profile-dropzone');
    dropzone.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key) && !busy) { event.preventDefault(); byId('kuro-profile-file').click(); } });
    dropzone.addEventListener('dragover', event => { event.preventDefault(); if (!busy) dropzone.classList.add('is-dragging'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
    dropzone.addEventListener('drop', event => { event.preventDefault(); dropzone.classList.remove('is-dragging'); chooseFile(event.dataTransfer?.files?.[0]); });
    byId('kuro-profile-display-name').addEventListener('input', updateLiveName);
    const hero = dialog.querySelector('.kuro-profile-hero'), plane = dialog.querySelector('.kuro-profile-hero-plane');
    const resetTilt = () => { cancelAnimationFrame(pointerFrame); plane.style.setProperty('--tilt-x', '0deg'); plane.style.setProperty('--tilt-y', '0deg'); };
    hero.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches || closing || !dialog?.open) return;
      const box = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => { plane.style.setProperty('--tilt-x', -y * 3 + 'deg'); plane.style.setProperty('--tilt-y', x * 4 + 'deg'); });
    });
    hero.addEventListener('pointerleave', resetTilt);
    dialog.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button || button.disabled || reducedMotion.matches) return;
      const box = button.getBoundingClientRect(), ripple = element('span', { class: 'kuro-profile-ripple', 'aria-hidden': 'true' });
      ripple.style.left = (event.detail ? event.clientX - box.left : box.width / 2) + 'px';
      ripple.style.top = (event.detail ? event.clientY - box.top : box.height / 2) + 'px';
      button.append(ripple); removeEffect(ripple, 700);
    });
    byId('kuro-profile-cancel-picture').addEventListener('click', () => { clearSelection(); updatePictures(); status('Preview canceled.'); });
    byId('kuro-profile-upload').addEventListener('click', () => { if (selected) mutate('/api/profile/avatar', 'POST', selected, selected.type, 'Picture saved.'); });
    byId('kuro-profile-remove').addEventListener('click', () => mutate('/api/profile/avatar', 'DELETE', '{}', 'application/json', 'Picture removed.'));
    byId('kuro-profile-name-form').addEventListener('submit', event => {
      event.preventDefault();
      const name = byId('kuro-profile-display-name').value.normalize('NFC').trim();
      if ([...name].length < 2 || [...name].length > 60 || /[\p{Cc}\p{Cf}]/u.test(name)) { status('Use 2–60 visible characters without control characters.', true); return; }
      mutate('/api/profile', 'POST', JSON.stringify({ name }), 'application/json', 'Display name saved.', true);
    });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => refresh(), 150); }
  // Observe existing auth requests without changing their body, return value or errors.
  window.fetch = function(input, options) {
    let auth = false, session = false;
    try {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
      auth = url.origin === location.origin && url.pathname.startsWith('/api/auth/'); session = url.pathname === '/api/auth/session';
    } catch { /* Preserve native fetch's handling of invalid requests. */ }
    if (auth && !session) clear();
    const result = nativeFetch(input, options);
    if (auth) result.then(response => {
      if (session) response.clone().json().then(data => {
        if (!data.user || data.recovery || (profile && data.user.id !== profile.id)) clear();
        schedule();
      }).catch(() => schedule());
      else schedule();
    }).catch(() => schedule());
    return result;
  };
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function(...args) { const result = original.apply(this, args); if (!onAccount()) clear(); schedule(); return result; };
  }
  addEventListener('popstate', schedule);
  addEventListener('focus', schedule);
  document.addEventListener('visibilitychange', () => { dialog?.classList.toggle('is-paused', document.hidden); if (!document.hidden) schedule(); });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { stopMotion(); const plane = dialog?.querySelector('.kuro-profile-hero-plane'); plane?.style.setProperty('--tilt-x', '0deg'); plane?.style.setProperty('--tilt-y', '0deg'); }
  });
  setInterval(() => { if (onAccount() && !document.hidden) refresh(); }, 15000);
  schedule();
})();
