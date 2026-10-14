import unittest
import os
from playwright.sync_api import sync_playwright, expect

origin=os.environ.get('APP_URL','http://127.0.0.1:4182')
class InstallLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.runtime=sync_playwright().start(); cls.browser=cls.runtime.chromium.launch(headless=True)
    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.runtime.stop()
    def setUp(self):
        self.context=self.browser.new_context()
    def tearDown(self):
        self.context.close()
    def page(self):
        page=self.context.new_page(); page.route('**/__proxy?*',lambda r:r.fulfill(status=503,body='External feed excluded'))
        page.route('**/api/catalogue/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Source network excluded from install lifecycle tests"}'))
        page.add_init_script("window.addEventListener('beforeinstallprompt',e=>{if(e.isTrusted)e.stopImmediatePropagation()},true)")
        return page
    def test_after_appinstalled_explicit_dialog_is_attached(self):
        page=self.page(); page.goto(origin,wait_until='networkidle')
        expect(page.locator('#kuro-install:not([hidden])')).to_be_visible(timeout=10000)
        page.evaluate("window.dispatchEvent(new Event('appinstalled')); window.dispatchEvent(new Event('kuro-install'))")
        expect(page.locator('#kuro-install:not([hidden])')).to_be_visible()
    def test_standalone_keeps_explicit_reentry(self):
        self.context.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
        page=self.page(); page.goto(origin,wait_until='networkidle'); page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
        expect(page.locator('#kuro-install:not([hidden])')).to_be_visible()
    def test_stalled_json_body_falls_back(self):
        self.context.add_init_script("""(() => {
          const fetch=window.fetch.bind(window), timer=window.setTimeout;
          window.setTimeout=(fn,ms,...args)=>timer(fn,ms===5000?200:ms,...args);
          window.fetch=(url,options={})=>{
            if(String(url)!=='/downloads/releases.json')return fetch(url,options);
            let body; const stream=new ReadableStream({start(controller){body=controller;controller.enqueue(new TextEncoder().encode('{'))}});
            options.signal?.addEventListener('abort',()=>body.error(new DOMException('Aborted','AbortError')));
            return Promise.resolve(new Response(stream,{headers:{'Content-Type':'application/json'}}));
          };
        })()""")
        page=self.page(); page.goto(origin,wait_until='networkidle')
        expect(page.get_by_role('button',name='Install',exact=True)).to_be_visible(timeout=7000)
if __name__=='__main__': unittest.main(verbosity=2)
