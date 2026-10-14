import hashlib
import json
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin=os.environ.get('APP_URL','http://127.0.0.1:4182')
root=Path(__file__).parent.parent
evidence=root/'work/toast-evidence'; evidence.mkdir(parents=True,exist_ok=True)
class InstallToast(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.runtime=sync_playwright().start(); cls.browser=cls.runtime.chromium.launch(headless=True)
    @classmethod
    def tearDownClass(cls): cls.browser.close(); cls.runtime.stop()
    def setUp(self): self.context=None
    def tearDown(self):
        if self.context:self.context.close()
    def page(self,mobile=False):
        self.context=self.browser.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},accept_downloads=True,is_mobile=mobile,has_touch=mobile,user_agent='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/145.0.0.0 Mobile Safari/537.36' if mobile else 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36')
        page=self.context.new_page(); page.route('**/__proxy?*',lambda r:r.fulfill(status=503,body='External feed excluded'))
        page.add_init_script("window.addEventListener('beforeinstallprompt',e=>{if(e.isTrusted)e.stopImmediatePropagation()},true)")
        page.route('**/api/catalogue/provider/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Source network excluded from install tests"}'))
        page.route('**/api/catalogue/mangadex?*',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Source network excluded from install tests"}'))
        page.route('**/api/catalogue/page?*',lambda r:r.fulfill(status=503,body='Source network excluded from install tests'))
        page.goto(origin,wait_until='networkidle'); return page
    def toast(self,page):
        notice=page.locator('#kuro-install:not([hidden])'); expect(notice).to_be_visible(timeout=10000)
        notice.evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))'); return notice
    def test_small_right_corner_nonmodal(self):
        page=self.page(); notice=self.toast(page); box=notice.bounding_box()
        self.assertLessEqual(box['width'],370); self.assertLessEqual(box['height'],185)
        self.assertGreater(box['x'],850); self.assertGreater(box['y'],600)
        self.assertNotEqual(notice.get_attribute('aria-modal'),'true')
        self.assertEqual(page.locator('#kuro-install-backdrop').count(),0)
        self.assertFalse(page.evaluate("document.activeElement.closest('#kuro-install')!==null"))
        page.screenshot(path=str(evidence/'windows-toast.png'))
        notice.screenshot(path=str(evidence/'windows-toast-detail.png'))
        page.get_by_role('button',name='Explore manga and manhwa',exact=True).click()
        self.assertIn('/search?',page.url)
    def test_windows_install_auto_selects_exe(self):
        page=self.page(); self.toast(page)
        action=page.locator('#kuro-install-action'); expect(action).to_have_text('Install')
        self.assertTrue(action.get_attribute('href').endswith('-windows.exe'))
        with page.expect_download() as event:action.click()
        file=evidence/'windows.exe';event.value.save_as(file)
        expected=page.request.get(origin+'/downloads/releases.json').json()['windows']
        self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),expected['sha256'])
        expect(page.locator('#kuro-install-help')).to_contain_text('Open the download')
    def test_android_install_auto_selects_apk(self):
        page=self.page(True); notice=self.toast(page);box=notice.bounding_box()
        self.assertLessEqual(box['width'],370);self.assertLessEqual(box['height'],185)
        self.assertGreaterEqual(box['x'],10);self.assertLessEqual(box['x']+box['width'],380)
        self.assertGreaterEqual(844-box['y']-box['height'],78)
        action=page.locator('#kuro-install-action');expect(action).to_have_text('Install')
        self.assertTrue(action.get_attribute('href').endswith('-android.apk'))
        page.screenshot(path=str(evidence/'android-toast.png'))
        with page.expect_download() as event:action.click()
        file=evidence/'android.apk';event.value.save_as(file)
        expected=page.request.get(origin+'/downloads/releases.json').json()['android']
        self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(),expected['sha256'])
    def test_auto_notice_preserves_typing_focus(self):
        page=self.page(); page.get_by_role('button',name='Sign in or create account',exact=True).click()
        page.get_by_role('textbox',name='Email address',exact=True).fill('still-editing@example.com')
        self.toast(page)
        expect(page.get_by_role('textbox',name='Email address',exact=True)).to_be_focused()
    def test_dismissal_and_manual_reentry(self):
        page=self.page();self.toast(page)
        page.get_by_role('button',name='Dismiss install notification',exact=True).click()
        expect(page.locator('#kuro-install')).to_be_hidden()
        page.reload(wait_until='networkidle');expect(page.locator('#kuro-install')).to_have_count(0)
        page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
        self.toast(page);expect(page.locator('#kuro-install-action')).to_be_focused()
        page.keyboard.press('Escape');expect(page.locator('#kuro-install')).to_be_hidden()
    def test_reduced_motion_and_no_page_errors(self):
        page=self.page();page.emulate_media(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        self.toast(page)
        self.assertEqual(page.locator('#kuro-install').evaluate('el=>el.getAnimations().length'),0)
        self.assertEqual(errors,[])
    def test_browser_offer_does_not_remove_focused_control(self):
        page=self.page();self.toast(page)
        action=page.locator('#kuro-install-action');action.focus()
        page.evaluate("const e=new Event('beforeinstallprompt');e.prompt=async()=>{};e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e)")
        page.wait_for_timeout(1400)
        expect(action).to_be_focused()
    def test_reader_navigation_hides_notice(self):
        page=self.page();self.toast(page)
        page.evaluate("history.pushState({},'', '/reader/local-fixture/chapter-1')")
        expect(page.locator('#kuro-install')).to_be_hidden()
    def test_pending_manual_open_does_not_focus_a_new_screen(self):
        self.context=self.browser.new_context();page=self.context.new_page();held=[]
        page.route('**/__proxy?*',lambda r:r.fulfill(status=503,body='External feed excluded'))
        page.route('**/downloads/releases.json',lambda r:held.append(r))
        page.add_init_script("window.addEventListener('beforeinstallprompt',e=>{if(e.isTrusted)e.stopImmediatePropagation()},true)")
        page.goto(origin,wait_until='domcontentloaded')
        page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
        page.get_by_role('button',name='Sign in or create account',exact=True).click()
        field=page.get_by_role('textbox',name='Email address',exact=True);field.fill('new-screen@example.com')
        self.assertTrue(held)
        metadata=json.loads((root/'dist/downloads/releases.json').read_text())
        held[0].fulfill(status=200,json=metadata)
        page.wait_for_timeout(500)
        expect(field).to_be_focused()
    def test_automatic_notice_has_polite_announcement(self):
        page=self.page();self.toast(page)
        status=page.locator('#kuro-install-announcement')
        expect(status).to_contain_text('Install KURO')
        self.assertEqual(status.get_attribute('aria-live'),'polite')
        self.assertFalse(page.evaluate("document.activeElement.closest('#kuro-install')!==null"))
if __name__=='__main__':unittest.main(verbosity=2)
