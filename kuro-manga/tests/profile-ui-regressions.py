import json
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get('APP_URL', 'http://127.0.0.1:4181')
root = Path(__file__).parent.parent

class ProfileInteractionChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.runtime = sync_playwright().start()
        cls.browser = cls.runtime.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.runtime.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1280,'height':900})
        self.context.add_init_script("localStorage.setItem('kuro-install-dismissed', String(Date.now()))")
        self.context.route('**/__proxy?*', lambda r:r.fulfill(status=503,body='External feed excluded'))
        self.errors = []
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda e:self.errors.append(str(e)))

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def login(self, page, email, name):
        response = page.request.post(origin + '/api/auth/login', headers={'Origin':origin}, data={'email':email,'password':'reader-password-123'})
        self.assertEqual(response.status, 200)
        uid = response.json()['user']['id']
        self.assertEqual(page.request.post(origin + '/api/profile', headers={'Origin':origin}, data={'name':name}).status, 200)
        return uid

    def open_editor(self, page):
        page.goto(origin + '/account', wait_until='networkidle')
        page.locator('#kuro-profile-launch').click()
        expect(page.get_by_role('dialog', name='Edit profile')).to_be_visible()

    def photo(self, page, filename, mime):
        response = page.request.post(origin + '/api/profile/avatar', headers={'Origin':origin,'Content-Type':'application/octet-stream','X-Kuro-Image-Type':mime}, data=(root / 'work' / filename).read_bytes())
        self.assertEqual(response.status, 200)

    def test_picture_actions_preserve_unsaved_name(self):
        self.login(self.page, 'draft-ui@example.com', 'Stored Reader')
        self.open_editor(self.page)
        self.page.get_by_label('Display name', exact=True).fill('Draft Reader')
        self.page.get_by_label('Choose profile picture', exact=True).set_input_files(root / 'work' / 'profile-input.png')
        self.page.get_by_role('button', name='Upload picture', exact=True).click()
        expect(self.page.locator('#kuro-profile-status')).to_contain_text('saved')
        expect(self.page.get_by_label('Display name', exact=True)).to_have_value('Draft Reader', timeout=1500)
        expect(self.page.locator('#kuro-profile-live-name')).to_have_text('Draft Reader')
        self.assertEqual(self.page.request.get(origin + '/api/profile').json()['name'], 'Stored Reader')
        self.page.get_by_role('button', name='Remove picture', exact=True).click()
        expect(self.page.locator('#kuro-profile-status')).to_contain_text('removed')
        expect(self.page.get_by_label('Display name', exact=True)).to_have_value('Draft Reader')
        self.page.get_by_role('button', name='Save name', exact=True).click()
        expect(self.page.locator('#kuro-profile-status')).to_contain_text('saved')
        self.assertEqual(self.page.request.get(origin + '/api/profile').json()['name'], 'Draft Reader')

    def test_shared_cookie_account_switch_refreshes_private_picture(self):
        self.login(self.page, 'switch-first@example.com', 'First Reader')
        self.photo(self.page, 'profile-input.png', 'image/png')
        self.open_editor(self.page)
        self.page.wait_for_function("document.querySelector('#kuro-profile-hero-picture')?.naturalWidth > 0")
        other = self.context.new_page()
        self.login(other, 'switch-second@example.com', 'Second Reader')
        self.photo(other, 'profile-input.jpg', 'image/jpeg')
        self.page.bring_to_front()
        self.page.evaluate("window.dispatchEvent(new Event('focus'))")
        expect(self.page.locator('#kuro-profile-name')).to_have_text('Second Reader')
        self.page.locator('#kuro-profile-launch').click()
        expect(self.page.get_by_role('dialog', name='Edit profile')).to_be_visible()
        self.page.wait_for_function("document.querySelector('#kuro-profile-hero-picture')?.naturalWidth > 0")
        color = self.page.locator('#kuro-profile-hero-picture').evaluate('''img => {
          const canvas = document.createElement('canvas'); canvas.width=canvas.height=1;
          const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,1,1);
          return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
        }''')
        self.assertTrue(all(abs(a-b) <= 8 for a,b in zip(color,[102,136,133])), 'Second account retained the first picture: '+str(color))

    def test_timeout_stops_loading_and_reports_uncertain_save(self):
        self.login(self.page, 'timeout-ui@example.com', 'Timeout Reader')
        self.open_editor(self.page)
        self.page.evaluate('''() => {
          const original=window.setTimeout.bind(window);
          window.setTimeout=(fn,delay,...args)=>original(fn,delay===25000?120:delay,...args);
        }''')
        held=[]
        def hold_post(route):
            if route.request.method == 'POST': held.append(route)
            else: route.continue_()
        self.page.route(origin + '/api/profile', hold_post)
        self.page.get_by_label('Display name', exact=True).fill('Pending Reader')
        self.page.get_by_role('button', name='Save name', exact=True).click()
        expect(self.page.locator('#kuro-profile-dialog')).to_have_attribute('data-feedback','error',timeout=1500)
        expect(self.page.locator('#kuro-profile-status')).to_contain_text('confirm')
        expect(self.page.get_by_role('button', name='Save name', exact=True)).to_be_enabled()
        expect(self.page.get_by_label('Display name', exact=True)).to_have_value('Pending Reader')
        self.page.wait_for_timeout(300)
        self.assertEqual(self.page.locator('.kuro-profile-feedback-mark').evaluate('(e) => e.getAnimations({subtree:true}).filter(a=>a.playState==="running").length'), 0)
        for route in held:
            route.abort()
        self.page.unroute(origin + '/api/profile', hold_post)

if __name__ == '__main__':
    unittest.main(verbosity=2)
