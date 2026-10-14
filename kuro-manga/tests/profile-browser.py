import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get('APP_URL', 'http://127.0.0.1:4181')
root = Path(__file__).parent.parent
evidence = root / 'work' / 'profile-evidence'
evidence.mkdir(parents=True, exist_ok=True)
checks = []
def checked(name):
    checks.append(name)
    print('PASS:', name)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/__proxy?*', lambda r: r.fulfill(status=503, body='External feed excluded'))
    page.route('https://**/*', lambda r: r.fulfill(status=503, body='External feed excluded'))
    page.goto(origin + '/account', wait_until='networkidle')
    expect(page.locator('#kuro-profile-launch')).to_have_count(0)
    expect(page.get_by_text('Continue with Google', exact=True)).to_be_visible()
    checked('guest account retains login controls without profile editor')
    result = page.request.post(origin + '/api/auth/login', headers={'Origin': origin}, data={'email':'browser-profile@example.com', 'password':'reader-password-123'})
    assert result.status == 200
    page.reload(wait_until='networkidle')
    expect(page.locator('#kuro-profile-launch')).to_be_visible()
    page.locator('#kuro-profile-launch').click()
    expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()
    old_profile = page.request.get(origin + '/api/profile').json()
    held = []
    def delay_snapshot(route):
        if route.request.method == 'GET' and not held:
            held.append(route)
        else:
            route.continue_()
    page.route(origin + '/api/profile', delay_snapshot)
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    page.wait_for_timeout(350)
    assert held, 'Expected a pending profile refresh'
    page.get_by_label('Display name', exact=True).fill('Kuro Explorer')
    page.get_by_role('button', name='Save name', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    held[0].fulfill(status=200, json=old_profile)
    page.wait_for_timeout(250)
    expect(page.locator('#kuro-profile-name')).to_have_text('Kuro Explorer')
    page.unroute(origin + '/api/profile', delay_snapshot)
    checked('a delayed old profile response cannot overwrite a completed save')
    page.get_by_role('button', name='Close profile editor').click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('#kuro-profile-name')).to_have_text('Kuro Explorer')
    checked('name save persists and refreshes the existing account state')
    page.locator('#kuro-profile-launch').click()
    expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()
    page.get_by_label('Choose profile picture', exact=True).set_input_files(root / 'work' / 'profile-input.png')
    expect(page.get_by_role('button', name='Upload picture', exact=True)).to_be_enabled()
    page.get_by_role('button', name='Upload picture', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    expect(page.get_by_role('button', name='Remove picture', exact=True)).to_be_enabled()
    assert page.request.get(origin + '/api/profile/avatar').status == 200
    page.screenshot(path=str(evidence / 'desktop-profile.png'))
    checked('image preview and upload use the real local API and private Storage fixture')
    page.get_by_label('Choose profile picture', exact=True).set_input_files(root / 'work' / 'profile-input.jpg')
    page.get_by_role('button', name='Upload picture', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    checked('replacement photo is saved')
    page.get_by_role('button', name='Remove picture', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('removed')
    assert page.request.get(origin + '/api/profile/avatar').status == 404
    checked('remove clears the private photo')
    page.get_by_label('Display name', exact=True).fill('<img src=x onerror=alert(1)>')
    page.get_by_role('button', name='Save name', exact=True).click()
    expect(page.locator('#kuro-profile-status')).to_contain_text('saved')
    assert page.locator('#kuro-profile-launch img[src="x"]').count() == 0
    page.get_by_role('button', name='Close profile editor').click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('#kuro-profile-name')).to_have_text('<img src=x onerror=alert(1)>')
    checked('user names are rendered as text and cannot inject HTML')
    page.locator('#kuro-profile-launch').click()
    expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()
    page.keyboard.press('Tab')
    assert page.evaluate("!!document.activeElement.closest('#kuro-profile-dialog')")
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog', name='Edit profile')).not_to_be_visible()
    checked('keyboard focus and Escape close the editor')
    page.get_by_text('Explore stories', exact=True).click()
    expect(page.locator('#kuro-profile-launch')).to_have_count(0)
    checked('SPA navigation removes profile controls outside account')
    page.goto(origin + '/account', wait_until='networkidle')
    page.get_by_text('Sign out', exact=True).click()
    expect(page.locator('#kuro-profile-launch')).to_have_count(0)
    expect(page.get_by_text('Continue with Google', exact=True)).to_be_visible()
    checked('the existing sign-out action clears the editor and its private preview')
    page.request.post(origin + '/api/auth/login', headers={'Origin': origin}, data={'email':'second-profile@example.com', 'password':'reader-password-123'})
    page.reload(wait_until='networkidle')
    expect(page.locator('#kuro-profile-name')).to_have_text('Fixture Reader')
    checked('a different account has a separate profile')
    context.close()

    context = browser.new_context(viewport={'width':390,'height':844})
    context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/__proxy?*', lambda r: r.fulfill(status=503, body='External feed excluded'))
    page.request.post(origin + '/api/auth/login', headers={'Origin':origin}, data={'email':'mobile-profile@example.com','password':'reader-password-123'})
    page.goto(origin + '/account', wait_until='networkidle')
    page.locator('#kuro-profile-launch').click()
    expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()
    assert page.locator('#kuro-profile-dialog').bounding_box()['width'] <= 390
    page.screenshot(path=str(evidence / 'mobile-profile.png'))
    checked('profile editor fits a mobile screen')
    assert not errors, errors
    checked('no uncaught page JavaScript errors')
    context.close()
    browser.close()
(evidence / 'results.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'page_errors':errors}, indent=2))
