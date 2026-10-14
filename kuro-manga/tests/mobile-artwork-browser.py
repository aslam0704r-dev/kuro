import importlib.util,unittest
from pathlib import Path
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('strict_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
class MobileArtworkBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):fixture.StrictContentBrowser.setUpClass.__func__(cls)
 @classmethod
 def tearDownClass(cls):fixture.StrictContentBrowser.tearDownClass.__func__(cls)
 setUp=fixture.StrictContentBrowser.setUp
 tearDown=fixture.StrictContentBrowser.tearDown
 api=fixture.StrictContentBrowser.api
 ready=fixture.StrictContentBrowser.ready
 no_errors=fixture.StrictContentBrowser.no_errors
 direct=fixture.StrictContentBrowser.direct
 def api(self,route):
  if route.request.url.split('?')[0].endswith('/cover'):
   from PIL import Image
   import io
   data=io.BytesIO();Image.new('RGB',(1200,1800),'#284849').save(data,format='PNG');route.fulfill(content_type='image/png',body=data.getvalue());return
  fixture.StrictContentBrowser.api(self,route)
 def home(self):
  self.ready('/providers');self.page.evaluate("()=>{const s=__r(784).useSettingsStore.getState();s.setAllSourcesEnabled(false);s.setSourceEnabled('mangadex',true);__r(11).router.push('/');}")
  expect(self.page.locator('[data-testid="premium-hero-art"]')).to_be_visible(timeout=15000)
 def test_desktop_keeps_original_artwork_component_and_layout(self):
  self.home();expect(self.page.locator('.kuro-mobile-artwork')).to_have_count(0);expect(self.page.locator('[data-testid="premium-hero-art"] img')).to_be_visible();self.no_errors()
 def test_mobile_uses_approved_original_cover_without_extra_blur_or_scale(self):
  self.page.set_viewport_size({'width':390,'height':844});self.home();self.page.wait_for_function("""()=>document.querySelector('[data-testid="premium-hero-art"] img')?.naturalWidth===1200""")
  self.assertEqual(self.page.locator('[data-testid="premium-hero-art"] img').evaluate('(e)=>getComputedStyle(e).filter'),'none');self.assertEqual(self.page.locator('[data-testid="spotlight-poster"]').evaluate('(e)=>getComputedStyle(e).transform'),'none');self.no_errors();self.page.screenshot(path=str(fixture.evidence/'mobile-safe-home.png'))
 def test_missing_approved_cover_keeps_story_button_and_neutral_artwork(self):
  self.context.route('**/api/catalogue/cover?*',lambda r:r.fulfill(status=404));self.page.set_viewport_size({'width':390,'height':844});self.home();expect(self.page.get_by_label('Artwork unavailable',exact=True)).to_be_visible();expect(self.page.get_by_role('button',name='Discover Mountain Friends',exact=True)).to_be_visible();self.no_errors()
 def test_portrait_resize_restores_original_desktop_artwork(self):
  self.page.set_viewport_size({'width':390,'height':844});self.home();expect(self.page.locator('.kuro-mobile-artwork')).to_have_count(1);self.page.set_viewport_size({'width':1280,'height':900});expect(self.page.locator('.kuro-mobile-artwork')).to_have_count(0);self.no_errors()
 def test_high_density_mobile_keeps_safe_cover_unscaled(self):
  self.context.close();self.context=self.browser.new_context(viewport={'width':360,'height':780},device_scale_factor=3,reduced_motion='no-preference');self.page=self.context.new_page();self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.context.route('https://**/*',lambda r:r.fulfill(status=503));self.context.route('**/api/catalogue/**',self.api);self.home();self.page.wait_for_timeout(500);self.assertEqual(self.page.locator('[data-testid="spotlight-poster"]').evaluate('(e)=>getComputedStyle(e).transform'),'none');self.no_errors()
if __name__=='__main__':unittest.main(verbosity=2)
