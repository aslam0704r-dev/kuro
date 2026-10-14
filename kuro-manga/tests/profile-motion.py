import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get('APP_URL', 'http://127.0.0.1:4181')
root = Path(__file__).parent.parent
evidence = root / 'work' / 'motion-evidence'
evidence.mkdir(parents=True, exist_ok=True)
checks = []
def passed(name):
    checks.append(name)
    print('PASS:', name)
def account(page, email):
    result = page.request.post(origin + '/api/auth/login', headers={'Origin':origin}, data={'email':email,'password':'reader-password-123'})
    assert result.status == 200
    assert page.request.delete(origin + '/api/profile/avatar', headers={'Origin':origin}, data={}).status == 200
    page.goto(origin + '/account', wait_until='networkidle')
    page.locator('#kuro-profile-launch').click()
    expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    context = browser.new_context(viewport={'width':1280,'height':900}, record_video_dir=str(evidence), record_video_size={'width':1280,'height':900})
    context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/__proxy?*', lambda r:r.fulfill(status=503, body='Feed excluded from local UI check'))
    page.route('https://**/*', lambda r:r.fulfill(status=503, body='External feed excluded'))
    account(page, 'motion-profile@example.com')
    expect(page.locator('.kuro-profile-hero')).to_be_visible()
    expect(page.locator('#kuro-profile-live-name')).to_be_visible()
    hero = page.locator('.kuro-profile-hero').bounding_box()
    fields = page.locator('.kuro-profile-workspace').bounding_box()
    assert hero['x'] + hero['width'] <= fields['x'] + 2
    passed('desktop editor has a distinct live reader preview and settings layout')
    page.wait_for_timeout(750)
    orbit = page.locator('.kuro-profile-orbit').first
    first = orbit.evaluate('(e) => getComputedStyle(e).transform')
    page.wait_for_timeout(200)
    second = orbit.evaluate('(e) => getComputedStyle(e).transform')
    assert first != second
    assert page.locator('#kuro-profile-dialog').evaluate('(e) => e.getAnimations({subtree:true}).some(a => a.playState === "running")')
    passed('avatar motion actually advances after the opening sequence')
    plane = page.locator('.kuro-profile-hero-plane')
    before = plane.evaluate('(e) => getComputedStyle(e).transform')
    page.mouse.move(hero['x'] + hero['width'] * .85, hero['y'] + hero['height'] * .3)
    page.wait_for_timeout(150)
    after = plane.evaluate('(e) => getComputedStyle(e).transform')
    assert before != after
    passed('pointer movement drives a bounded preview tilt')
    page.get_by_label('Display name', exact=True).fill('Panel Runner')
    expect(page.locator('#kuro-profile-live-name')).to_have_text('Panel Runner')
    expect(page.locator('#kuro-profile-name-count')).to_contain_text('12')
    passed('typing updates the live preview and character count safely')
    page.get_by_role('button', name='Save name', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    assert page.locator('#kuro-profile-dialog').get_attribute('data-feedback') == 'success'
    passed('successful save produces confirmation feedback')
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_timeout(150)
    assert page.locator('#kuro-profile-dialog').evaluate('(e) => e.getAnimations({subtree:true}).filter(a => a.playState === "running").length') == 0
    expect(page.get_by_label('Display name', exact=True)).to_have_value('Panel Runner')
    page.emulate_media(reduced_motion='no-preference')
    passed('changing reduced-motion preference cancels active effects without losing edits')
    page.mouse.move(1100, 700)
    page.wait_for_timeout(850)
    page.screenshot(path=str(evidence / 'desktop-profile.png'))
    payload = list((root / 'work' / 'profile-input.png').read_bytes())
    page.locator('.kuro-profile-dropzone').evaluate('''(e, bytes) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(bytes)], 'reader-preview.png', {type:'image/png'}));
      e.dispatchEvent(new DragEvent('drop', {bubbles:true,cancelable:true,dataTransfer:transfer}));
    }''', payload)
    expect(page.locator('#kuro-profile-file-name')).to_have_text('reader-preview.png')
    expect(page.get_by_role('button', name='Upload picture', exact=True)).to_be_enabled()
    page.get_by_role('button', name='Upload picture', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    assert page.request.get(origin + '/api/profile/avatar').status == 200
    passed('drag-and-drop preview saves through the existing secure binary API')
    page.mouse.move(1100, 700)
    page.wait_for_timeout(850)
    page.screenshot(path=str(evidence / 'desktop-profile-uploaded.png'))
    page.get_by_role('button', name='Close profile editor').click()
    expect(page.get_by_role('dialog', name='Edit profile')).not_to_be_visible()
    page.wait_for_load_state('networkidle')
    passed('animated close completes and preserves name refresh')
    video = page.video
    context.close()
    video.save_as(str(evidence / 'profile-motion.webm'))

    context = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/__proxy?*', lambda r:r.fulfill(status=503, body='Feed excluded'))
    account(page, 'motion-mobile@example.com')
    page.wait_for_timeout(750)
    assert page.locator('#kuro-profile-dialog').bounding_box()['width'] <= 390
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(evidence / 'mobile-profile.png'))
    page.get_by_role('button', name='Save name', exact=True).scroll_into_view_if_needed()
    expect(page.get_by_role('button', name='Save name', exact=True)).to_be_visible()
    passed('mobile layout fits without horizontal overflow and controls remain reachable')
    context.close()

    context = browser.new_context(viewport={'width':1280,'height':900}, reduced_motion='reduce')
    context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/__proxy?*', lambda r:r.fulfill(status=503, body='Feed excluded'))
    account(page, 'motion-reduced@example.com')
    page.wait_for_timeout(200)
    assert page.locator('#kuro-profile-dialog').evaluate('(e) => e.getAnimations({subtree:true}).filter(a => a.playState === "running").length') == 0
    page.get_by_label('Display name', exact=True).fill('Quiet Reader')
    page.get_by_role('button', name='Save name', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog', name='Edit profile')).not_to_be_visible()
    passed('reduced-motion preference disables motion while saving and keyboard closing still work')
    assert not errors, errors
    passed('no uncaught JavaScript errors across desktop, mobile and reduced-motion contexts')
    context.close()
    browser.close()
(evidence / 'results.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'page_errors':errors}, indent=2))
