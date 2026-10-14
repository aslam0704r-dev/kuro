import importlib.util,unittest,time
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('strict_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
class ReadableBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):fixture.StrictContentBrowser.setUpClass.__func__(cls)
 @classmethod
 def tearDownClass(cls):fixture.StrictContentBrowser.tearDownClass.__func__(cls)
 setUp=fixture.StrictContentBrowser.setUp
 tearDown=fixture.StrictContentBrowser.tearDown
 ready=fixture.StrictContentBrowser.ready
 no_errors=fixture.StrictContentBrowser.no_errors
 direct=fixture.StrictContentBrowser.direct
 api=fixture.StrictContentBrowser.api
 def test_disabled_optional_readability_filter_still_hides_unverified_title(self):
  self.ready('/providers')
  result=self.page.evaluate("""async()=>{const c=KuroCatalogueCore,m=__r(789).sourceManager.require('mangadex');m.getChapterList=async()=>[];c.notify();const s=__r(784).useSettingsStore.getState();s.setAllSourcesEnabled(false);s.setSourceEnabled('mangadex',true);__r(11).router.push('/search?query=Mountain&readable=false');return true;}""")
  self.page.wait_for_timeout(1200);expect(self.page.get_by_text('Mountain Friends',exact=True)).to_have_count(0);self.no_errors()
 def test_sample_only_manifest_cannot_open_reader_or_create_history(self):
  self.context.route('**/api/catalogue/provider/mangadex/pages?*',lambda route:route.fulfill(json={'result':{'chapterId':'mangadex:'+fixture.CID,'verified':True,'sampledPages':2,'contentApproval':{'version':'strict-1','mangaId':'mangadex-'+fixture.MID},'pages':[{'index':0,'url':fixture.origin+'/api/catalogue/page?ticket=old'}]}}))
  self.ready(self.direct(fixture.MID,True));expect(self.page.get_by_text('This title is unavailable',exact=True)).to_be_visible();self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getState().entries.length'),0);self.no_errors()
 def test_pending_manifest_waits_for_the_whole_chapter_before_mounting_reader(self):
  held=[];calls=[]
  def pages(route):
   calls.append(route)
   if len(calls)==1:route.fulfill(json={'result':{'chapterId':'mangadex:'+fixture.CID,'verified':False,'pending':True,'validation':'complete-chapter','validatedPages':2,'pageCount':3,'contentApproval':{'version':'strict-1','mangaId':'mangadex-'+fixture.MID},'pages':[]}})
   elif len(calls)==2:held.append(route)
   else:self.api(route)
  self.context.route('**/api/catalogue/provider/mangadex/pages?*',pages);self.ready(self.direct(fixture.MID,True));self.page.wait_for_timeout(1000)
  self.assertTrue(held);self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getState().entries.length'),0);self.assertFalse(self.page.evaluate('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/page"))'))
  self.api(held[0]);self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/page")&&i.complete&&i.naturalWidth>0)');self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getState().entries.length'),1);self.no_errors()
 def test_broken_requested_chapter_is_hidden_even_when_another_chapter_qualifies_title(self):
  self.context.route('**/api/catalogue/readable/check?*',lambda r:r.fulfill(json={'ready':True,'validation':'complete-chapter','validatedPages':3,'pageCount':3,'expiresAt':int(time.time()*1000)+3600000,'chapterId':'mangadex:33333333-3333-4333-8333-333333333333'}))
  self.context.route('**/api/catalogue/provider/mangadex/pages?*',lambda r:r.fulfill(status=422,json={'error':'Corrupt middle page'}))
  self.ready(self.direct(fixture.MID,True));expect(self.page.get_by_text('This title is unavailable',exact=True)).to_be_visible();self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getState().entries.length'),0);self.no_errors()
 def test_provider_directory_explains_exact_verified_count_and_scope(self):
  self.context.route('**/api/catalogue/readable/count',lambda r:r.fulfill(json={'uniqueCount':23,'duplicatesGrouped':2,'windowMs':21600000,'entireProviderAudited':False}))
  self.ready('/providers');expect(self.page.locator('#kuro-readable-count')).to_contain_text('23 unique verified readable titles');expect(self.page.locator('#kuro-readable-count')).to_contain_text('other provider entries remain unverified');self.no_errors()
 def test_duplicate_edition_library_rows_are_preserved_but_show_one_title(self):
  other='33333333-3333-4333-8333-333333333333'
  def content(route):
   q=parse_qs(urlparse(route.request.url).query);identity=q.get('id',[''])[0];m={**fixture.manga(),'id':identity,'identityKeys':['mdx:'+identity[9:],'mal:123']};route.fulfill(json={'allowed':True,'policyVersion':'strict-1','manga':m})
  self.context.route('**/api/catalogue/content/check?*',content)
  self.context.route('**/api/catalogue/readable/check?*',lambda r:r.fulfill(json={'ready':True,'validation':'complete-chapter','validatedPages':3,'pageCount':3,'expiresAt':int(time.time()*1000)+3600000}))
  self.ready();self.page.evaluate("()=>{for(const id of ['"+fixture.MID+"','"+other+"'])__r(1249).useLibraryStore.getState().add({id:'mangadex-'+id,sourceId:'mangadex',title:'Old title',genres:[],status:'ONGOING'});}")
  self.page.wait_for_function('()=>Object.keys(__r(1249).useLibraryStore.getVisibleState().entries).length===1');self.assertEqual(self.page.evaluate('Object.keys(__r(1249).useLibraryStore.getState().entries).length'),2);self.no_errors()
if __name__=='__main__':unittest.main(verbosity=2)
