import hashlib
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin=os.environ.get('APP_URL','http://127.0.0.1:4182')
root=Path(__file__).parent.parent
evidence=root/'work/native-evidence'
evidence.mkdir(parents=True,exist_ok=True)
checks=[]
def checked(name):
    checks.append(name); print('PASS:',name)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    def page_for(context):
        page=context.new_page()
        page.add_init_script("window.addEventListener('beforeinstallprompt',e=>{if(e.isTrusted)e.stopImmediatePropagation()},true)")
        page.route('**/__proxy?*',lambda r:r.fulfill(status=503,body='External feed excluded'))
        page.route('**/api/catalogue/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Source network excluded from native tests"}'))
        return page
    context=browser.new_context(viewport={'width':1280,'height':900},accept_downloads=True,user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36')
    page=page_for(context)
    page.goto(origin,wait_until='networkidle')
    expect(page.get_by_role('link',name='Install KURO for Windows',exact=True)).to_be_visible(timeout=10000)
    page.locator('#kuro-install').evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))')
    page.screenshot(path=str(evidence/'windows-popup.png'))
    with page.expect_download() as event:
        page.get_by_role('link',name='Install KURO for Windows',exact=True).click()
    download=event.value
    path=evidence/'downloaded-windows.exe'; download.save_as(path)
    metadata=page.request.get(origin+'/downloads/releases.json').json()
    assert hashlib.sha256(path.read_bytes()).hexdigest()==metadata['windows']['sha256']
    assert path.read_bytes()==(root/'dist'/metadata['windows']['url'].lstrip('/')).read_bytes()
    expect(page.locator('#kuro-install-help')).to_contain_text('Open the download')
    assert 'installed successfully' not in page.locator('#kuro-install').inner_text().lower()
    checked('Windows offers and downloads the actual EXE with matching release bytes; never claims OS installation')
    page.get_by_role('button',name='Install KURO in your browser',exact=True).click()
    expect(page.locator('#kuro-install-help')).to_contain_text('Open in app')
    checked('browser installation remains available alongside the Windows installer')
    page.get_by_role('button',name='Later',exact=True).click()
    page.reload(wait_until='networkidle')
    expect(page.locator('#kuro-install:not([hidden])')).to_have_count(0)
    checked('dismissal remains effective across reloads')
    context.close()

    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True,user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/145.0.0.0 Mobile Safari/537.36')
    page=page_for(context); page.goto(origin,wait_until='networkidle')
    expect(page.get_by_role('link',name='Install KURO for Android',exact=True)).to_be_visible(timeout=10000)
    page.locator('#kuro-install').evaluate('(el)=>Promise.all(el.getAnimations().map(a=>a.finished))')
    page.screenshot(path=str(evidence/'android-popup.png'))
    with page.expect_download() as event:
        page.get_by_role('link',name='Install KURO for Android',exact=True).click()
    path=evidence/'downloaded-android.apk'; event.value.save_as(path)
    metadata=page.request.get(origin+'/downloads/releases.json').json()
    assert hashlib.sha256(path.read_bytes()).hexdigest()==metadata['android']['sha256']
    assert path.read_bytes()==(root/'dist'/metadata['android']['url'].lstrip('/')).read_bytes()
    assert page.locator('#kuro-install').bounding_box()['width']<=390
    expect(page.locator('#kuro-install-help')).to_contain_text('Android')
    checked('Android offers and downloads the actual signed APK and fits the mobile screen')
    context.close()

    for label,interception in [
        ('missing release manifest', lambda r:r.fulfill(status=404,body='missing')),
        ('HTML masquerading as release metadata',lambda r:r.fulfill(status=200,content_type='text/html',body='<h1>KURO</h1>')),
        ('cross-origin download metadata',lambda r:r.fulfill(json={'schema':1,'version':'3.9.0','windows':{'url':'https://evil.invalid/app.exe','bytes':55,'sha256':'a'*64,'minimumSystem':'Windows 10/11'}}))
    ]:
        context=browser.new_context(); page=page_for(context); page.route('**/downloads/releases.json',interception); page.goto(origin,wait_until='networkidle')
        expect(page.get_by_role('button',name='Install',exact=True)).to_be_visible(timeout=10000)
        expect(page.get_by_role('link',name='Install KURO for Windows',exact=True)).to_have_count(0)
        checked(label+' preserves browser installation and exposes no native link'); context.close()
    context=browser.new_context(); page=page_for(context)
    page.route('**/downloads/*.exe',lambda r:r.fulfill(status=200,content_type='text/html',body='<h1>SPA fallback</h1>'))
    page.goto(origin,wait_until='networkidle')
    expect(page.get_by_role('button',name='Install',exact=True)).to_be_visible(timeout=10000)
    expect(page.get_by_role('link',name='Install KURO for Windows',exact=True)).to_have_count(0)
    checked('HTML masquerading as the EXE does not become an installer offer'); context.close()
    context=browser.new_context(); page=page_for(context); page.goto(origin+'/?kuro-native=windows',wait_until='networkidle')
    page.wait_for_timeout(3800); expect(page.locator('#kuro-install:not([hidden])')).to_have_count(0)
    checked('native launch entry suppresses automatic install prompting'); context.close()
    context=browser.new_context(user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1')
    page=page_for(context); page.goto(origin,wait_until='networkidle')
    expect(page.get_by_role('button',name='Install',exact=True)).to_be_visible(timeout=10000)
    expect(page.get_by_role('link',name='Install KURO for Windows',exact=True)).to_have_count(0)
    page.get_by_role('button',name='Install',exact=True).click(); expect(page.locator('#kuro-install-help')).to_contain_text('Safari')
    checked('iPhone keeps supported Safari installation instructions'); context.close()
    context=browser.new_context(); page=page_for(context); page.goto(origin,wait_until='networkidle')
    expect(page.locator('#kuro-install:not([hidden])')).to_be_visible(timeout=10000)
    page.evaluate("window.dispatchEvent(new Event('appinstalled')); window.dispatchEvent(new Event('kuro-install'))")
    expect(page.locator('#kuro-install:not([hidden])')).to_be_visible()
    checked('explicit re-entry after appinstalled creates an attached working notice'); context.close()
    context=browser.new_context(); context.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
    page=page_for(context); page.goto(origin,wait_until='networkidle'); page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
    expect(page.locator('#kuro-install:not([hidden])')).to_be_visible()
    checked('installed browser app allows explicit installation re-entry'); context.close()
    context=browser.new_context()
    context.add_init_script("""(() => {
      const originalFetch=window.fetch.bind(window), originalTimer=window.setTimeout;
      window.setTimeout=(fn,ms,...args)=>originalTimer(fn,ms===5000?200:ms,...args);
      window.fetch=(input,options={})=>{
        if(String(input)==='/downloads/releases.json') {
          let body;
          const stream=new ReadableStream({start(controller){body=controller;controller.enqueue(new TextEncoder().encode('{'));}});
          options.signal?.addEventListener('abort',()=>body.error(new DOMException('Aborted','AbortError')));
          return Promise.resolve(new Response(stream,{status:200,headers:{'Content-Type':'application/json'}}));
        }
        return originalFetch(input,options);
      };
    })()""")
    page=page_for(context); page.goto(origin,wait_until='networkidle')
    expect(page.get_by_role('button',name='Install',exact=True)).to_be_visible(timeout=7000)
    checked('stalled release response body times out and preserves browser installation'); context.close()
    browser.close()
(evidence/'native-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
