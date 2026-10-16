import importlib.util,time,unittest,os
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('content_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)

class ProviderLoadingBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):fixture.StrictContentBrowser.setUpClass.__func__(cls)
 @classmethod
 def tearDownClass(cls):fixture.StrictContentBrowser.tearDownClass.__func__(cls)
 def setUp(self):
  fixture.StrictContentBrowser.setUp(self);self.page.set_default_timeout(4000)
  baseline=os.environ.get('KURO_BASELINE_BOOTSTRAP')
  if baseline:self.context.route('**/catalogue-core.js',lambda route:route.fulfill(content_type='text/javascript',body=Path(baseline).read_bytes()))
 tearDown=fixture.StrictContentBrowser.tearDown
 ready=fixture.StrictContentBrowser.ready
 no_errors=fixture.StrictContentBrowser.no_errors
 def api(self,route):
  parsed=urlparse(route.request.url);q=parse_qs(parsed.query)
  if getattr(self,'limited',False) and parsed.path.endswith('/mangadex'):
   self.limited_calls+=1;route.fulfill(status=429,headers={'Retry-After':'60'},json={'error':'Source rate limit reached'});return
  if getattr(self,'cold',False):
   mids=[f'{n:08d}-1111-4111-8111-111111111111' for n in range(1,4)]
   cids=[f'{n:08d}-2222-4222-8222-222222222222' for n in range(1,4)]
   def manga(index):
    value=fixture.manga();value.update(id='mangadex-'+mids[index],title=['Long Journey A','Long Journey B','Quick Adventure'][index]);return value
   if parsed.path.endswith('/mangadex'):
    upstream=urlparse(q.get('path',[''])[0])
    if upstream.path=='/manga':
     rows=[]
     for index,mid in enumerate(mids):
      raw=fixture.raw();raw.update(id=mid);raw['attributes']['title']={'en':manga(index)['title']};rows.append(raw)
     route.fulfill(json={'result':'ok','data':rows,'total':3,'limit':20,'offset':0});return
    for index,mid in enumerate(mids):
     if upstream.path==f'/manga/{mid}/feed':
      route.fulfill(json={'result':'ok','data':[{'id':cids[index],'type':'chapter','attributes':{'chapter':'1','title':'Beginning','pages':3 if index==2 else 100,'translatedLanguage':'en','externalUrl':None,'volume':None},'relationships':[{'id':mid,'type':'manga'}]}],'total':1});return
   if parsed.path.endswith('/readable/check'):
    route.fulfill(json={'ready':False,'asOf':int(time.time()*1000),'inventoryRevision':0});return
   if parsed.path.endswith('/content/check'):
    mid=q.get('id',[''])[0].removeprefix('mangadex-')
    if mid in mids:route.fulfill(json={'allowed':True,'policyVersion':'strict-1','manga':manga(mids.index(mid))});return
   if parsed.path.endswith('/provider/mangadex/pages'):
    cid=q.get('id',[''])[0].removeprefix('mangadex:');index=cids.index(cid);self.page_calls.append(index)
    base={'chapterId':'mangadex:'+cid,'contentApproval':{'version':'strict-1','mangaId':'mangadex-'+mids[index]},'validation':'complete-chapter','expiresAt':int(time.time()*1000)+3600000,'readabilityAsOf':int(time.time()*1000),'inventoryRevision':1}
    if index<2:route.fulfill(json={'result':{**base,'verified':False,'pending':True,'validatedPages':2,'pageCount':100,'pages':[]}})
    else:route.fulfill(json={'result':{**base,'verified':True,'pending':False,'validatedPages':3,'pageCount':3,'pages':[{'index':i,'url':fixture.origin+'/api/catalogue/page?ticket=fixture'+str(i)} for i in range(3)]}})
    return
  return fixture.StrictContentBrowser.api(self,route)
 def find(self,name):
  self.page.get_by_label('Find a provider',exact=True).fill(name)
 def test_only_verified_sources_are_on_in_a_fresh_browser(self):
  self.ready('/providers');prefs=self.page.evaluate('__r(784).useSettingsStore.getState().sourcePreferences')
  remote={p['id']:prefs[p['id']] for p in fixture.registry['providers']};self.assertEqual(len(remote),1236);self.assertEqual(sorted(k for k,v in remote.items() if v['enabled']),['anilist','mangadex']);self.no_errors()
 def test_directory_starts_with_usable_readers_and_search_still_finds_comix(self):
  self.ready('/providers');expect(self.page.get_by_label('Provider availability',exact=True)).to_have_value('reader');expect(self.page.locator('[data-provider-id="mangadex"]')).to_be_visible();expect(self.page.locator('.kuro-provider-row')).to_have_count(1)
  self.find('Comix');expect(self.page.locator('[data-provider-id="comix"]')).to_be_visible();expect(self.page.locator('[data-provider-id="comix"]').get_by_role('checkbox')).to_be_disabled();expect(self.page.get_by_label('Provider availability',exact=True)).to_have_value('all');self.find('');expect(self.page.locator('.kuro-provider-row')).to_have_count(1);self.no_errors()
 def test_complete_directory_remains_accessible(self):
  self.ready('/providers');self.page.get_by_role('button',name='Show all provider entries',exact=True).click();expect(self.page.get_by_label('Provider availability',exact=True)).to_have_value('all');expect(self.page.locator('#kuro-directory-count')).to_contain_text('1236 providers found');self.no_errors()
 def test_refresh_connections_never_waits_for_feed_or_chapter_work(self):
  self.ready('/providers');self.page.evaluate("()=>{KuroCatalogue.refresh=()=>{throw Error('Unexpected feed refresh')};KuroCatalogue.manager.feedAll=()=>{throw Error('Unexpected catalogue fetch')};}")
  self.page.get_by_role('button',name='Refresh connections',exact=False).click();expect(self.page.locator('#kuro-directory-count')).to_contain_text('Connection status refreshed');expect(self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox')).to_be_checked();self.no_errors()
 def test_slow_application_bundle_does_not_permanently_disable_provider_controls(self):
  def delayed(route):time.sleep(3.5);route.continue_()
  self.context.route('**/_expo/static/js/web/entry-*.js',delayed);self.ready('/providers');expect(self.page.locator('[data-provider-id="mangadex"]')).to_be_visible();self.no_errors()
 def test_available_reader_action_recovers_without_enabling_comix(self):
  self.ready('/providers');self.page.evaluate('__r(784).useSettingsStore.getState().setAllSourcesEnabled(false)');self.page.get_by_role('link',name='Browse available manga',exact=True).click();self.page.wait_for_url('**/search?source=mangadex');self.page.wait_for_function('()=>window.KuroCatalogue?.ready');prefs=self.page.evaluate('__r(784).useSettingsStore.getState().sourcePreferences');self.assertTrue(prefs['mangadex']['enabled']);self.assertFalse(prefs['comix']['enabled']);self.no_errors()
 def test_unusable_connector_stays_disabled_and_off_after_reload(self):
  self.ready('/providers');self.find('Guya');row=self.page.locator('[data-provider-id="guya"]');checkbox=row.get_by_role('checkbox');expect(checkbox).to_be_disabled();expect(checkbox).not_to_be_checked();self.page.reload();self.page.wait_for_function('()=>window.KuroCatalogue?.ready');self.find('Guya');expect(self.page.locator('[data-provider-id="guya"]').get_by_role('checkbox')).not_to_be_checked();self.assertEqual(self.page.evaluate('__r(789).sourceManager.enabled(["guya"]).length'),0);self.no_errors()
 def test_external_platform_selection_is_not_presented_as_a_reader(self):
  self.ready('/providers');self.find('MANGA Plus');row=self.page.locator('[data-provider-id="mangaplus"]');expect(row.get_by_role('checkbox')).to_be_disabled();expect(row).to_contain_text('External platform');expect(row.get_by_role('link',name='Browse',exact=True)).to_have_count(0);expect(row.get_by_role('link',name='Visit platform ↗')).to_have_attribute('href','https://mangaplus.shueisha.co.jp/');self.no_errors()
 def test_unresolved_source_selection_has_no_fabricated_reader_or_link(self):
  source=next(p for p in fixture.registry['providers'] if p['mode']=='unresolved');self.ready('/providers');self.find(source['name']);row=self.page.locator('[data-provider-id="'+source['id']+'"]');expect(row.get_by_role('checkbox')).to_be_disabled();expect(row).to_contain_text('Connection unavailable');expect(row.get_by_role('link')).to_have_count(0);self.no_errors()
 def test_defaults_button_clears_optional_selections(self):
  self.ready('/providers');self.find('MangaDex');self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox').uncheck();self.page.evaluate('__r(784).useSettingsStore.getState().patchReader({stripGap:8})');self.page.get_by_role('button',name='Use verified defaults',exact=True).click();expect(self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox')).to_be_checked();self.assertEqual(self.page.evaluate('__r(784).useSettingsStore.getState().reader.stripGap'),8);self.no_errors()
 def test_selecting_unavailable_sources_does_not_crash_home_or_send_requests_to_them(self):
  self.ready('/providers');self.page.evaluate('__r(784).useSettingsStore.getState().setAllSourcesEnabled(true)');self.page.goto(fixture.origin+'/');self.page.wait_for_function('()=>window.KuroCatalogue?.ready');self.page.wait_for_timeout(1200);self.no_errors();self.assertFalse(any('/provider/guya/' in path or '/provider/mangaplus/' in path for path in self.requests))
 def cold_page(self,path):
  self.cold=True;self.page_calls=[];start=time.monotonic();self.ready(path);expect(self.page.get_by_text('Quick Adventure',exact=True).first).to_be_visible(timeout=6000);self.assertIn(2,self.page_calls);expect(self.page.locator('img[src*="/api/catalogue/cover"]').first).to_be_visible();covers=self.page.locator('img[src*="/api/catalogue/cover"]').evaluate_all('(images)=>images.map(image=>image.src)');self.assertGreater(len(covers),0);self.assertTrue(all('00000003-1111-4111-8111-111111111111' in cover for cover in covers));self.no_errors();print('Cold fair queue:',path,round((time.monotonic()-start)*1000),'ms; short title visible while both long chapters remain pending')
 def test_home_short_title_appears_while_earlier_long_chapters_are_pending(self):self.cold_page('/')
 def test_search_short_title_appears_while_earlier_long_chapters_are_pending(self):self.cold_page('/search')
 def test_mobile_provider_switches_fit_and_can_be_used(self):
  self.page.set_viewport_size({'width':390,'height':844});self.ready('/providers');self.find('MangaDex');self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox').uncheck();self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox').check();self.assertLessEqual(self.page.locator('#kuro-provider-directory').evaluate('(e)=>e.scrollWidth'),390);self.no_errors()
 def test_metadata_rate_limit_does_not_trigger_rapid_retry_requests(self):
  self.limited=True;self.limited_calls=0;self.ready('/search');self.page.wait_for_timeout(1800);self.assertEqual(self.limited_calls,1);self.no_errors()

if __name__=='__main__':unittest.main(verbosity=2)
