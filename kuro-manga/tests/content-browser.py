import io,json,os,time,unittest
from pathlib import Path
from urllib.parse import urlparse,parse_qs,quote
from PIL import Image
from playwright.sync_api import sync_playwright,expect

root=Path(__file__).parent.parent
origin=os.environ.get('APP_URL','http://127.0.0.1:4184')
registry=json.loads((root/'dist/provider-registry.json').read_text(encoding='utf-8'))
evidence=root/'work/content-evidence';evidence.mkdir(parents=True,exist_ok=True)
MID='11111111-1111-4111-8111-111111111111';CID='22222222-2222-4222-8222-222222222222'
BAD='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
image=io.BytesIO();Image.new('RGB',(800,1200),'#31495b').save(image,format='PNG');image=image.getvalue()
def manga():
 return {'id':'mangadex-'+MID,'sourceId':'mangadex','title':'Mountain Friends','description':'An approved adventure.','genres':['Adventure'],'status':'ONGOING','coverUrl':origin+'/api/catalogue/cover?provider=mangadex&id=mangadex-'+MID,'contentApproval':{'version':'strict-1','evidence':'mangadex:contentRating=safe','checkedAt':int(time.time()*1000)}}
def chapter(cid=CID):return {'id':'mangadex:'+cid,'mangaId':'mangadex-'+MID,'sourceId':'mangadex','title':'Beginning','chapterNumber':1,'publishDate':0,'pages':3}
def raw():return {'id':MID,'type':'manga','attributes':{'contentRating':'safe','title':{'en':'Mountain Friends'},'description':{'en':'An approved adventure.'},'tags':[],'status':'ongoing','altTitles':[],'links':{}},'relationships':[],'kuroContentApproval':manga()['contentApproval']}

class StrictContentBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True)
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[];self.requests=[];self.approved=True
  self.page.on('pageerror',lambda error:self.errors.append(str(error)))
  self.context.route('https://**/*',lambda route:route.fulfill(status=503,body='External network excluded'))
  self.context.route('**/api/catalogue/**',self.api)
 def tearDown(self):self.context.close()
 def api(self,route):
  parsed=urlparse(route.request.url);q=parse_qs(parsed.query);self.requests.append(parsed.path+'?'+parsed.query)
  if parsed.path.endswith('/providers'):
   route.fulfill(json={**registry,'providers':[{**p,'available':p['id'] in ['mangadex','anilist'],'contentPolicy':{'state':'eligible' if p['id'] in ['mangadex','anilist'] else 'blocked' if p.get('contentWarning')=='NSFW' else 'restricted'}} for p in registry['providers']]});return
  if parsed.path.endswith('/content/check'):
   if q.get('provider')!=['mangadex'] or q.get('id')!=['mangadex-'+MID] or not self.approved:route.fulfill(status=403,json={'error':'Strict content rules: title is not approved.'});return
   data={'allowed':True,'policyVersion':'strict-1','manga':manga()}
   if q.get('chapter'):
    if q['chapter'][0] not in ['mangadex:'+CID,'mangadex:33333333-3333-4333-8333-333333333333']:route.fulfill(status=403,json={'error':'Chapter does not belong to approved manga'});return
    data['chapter']=chapter(q['chapter'][0].split(':')[1])
   route.fulfill(json=data);return
  if parsed.path.endswith('/cover') or parsed.path.endswith('/page'):route.fulfill(content_type='image/png',body=image);return
  if parsed.path.endswith('/mangadex'):
   upstream=urlparse(q.get('path',[''])[0]);path=upstream.path
   if path=='/manga':data={'result':'ok','data':[raw()],'total':1,'limit':20,'offset':0}
   elif path=='/manga/'+MID:data={'result':'ok','data':raw()}
   elif path=='/manga/'+MID+'/feed':data={'result':'ok','data':[{'id':CID,'type':'chapter','attributes':{'title':'Beginning','chapter':'1','translatedLanguage':'en','pages':3,'volume':None,'externalUrl':None},'relationships':[{'id':MID,'type':'manga'}]}],'total':1,'limit':500,'offset':0}
   elif path=='/statistics/manga':data={'statistics':{MID:{'rating':{'average':9},'follows':10}}}
   else:route.fulfill(status=403,json={'error':'Unverified metadata'});return
   route.fulfill(json=data);return
  if parsed.path=='/api/catalogue/provider/mangadex/pages':
   cid=q.get('id',['mangadex:'+CID])[0];route.fulfill(json={'result':{'chapterId':cid,'verified':True,'validation':'complete-chapter','validatedPages':3,'pageCount':3,'contentApproval':{'version':'strict-1','mangaId':'mangadex-'+MID},'pages':[{'index':i,'url':origin+'/api/catalogue/page?ticket=fixture'+str(i)} for i in range(3)],'credits':[{'name':'Fixture Team','url':'https://mangadex.org/'}]}});return
  route.fulfill(status=403,json={'error':'Strict content rules: provider is restricted.'})
 def ready(self,path='/library'):
  self.page.goto(origin+path,wait_until='domcontentloaded');self.page.wait_for_function('()=>window.KuroCatalogue?.ready',timeout=15000)
 def no_errors(self):self.assertEqual(self.errors,[])
 def direct(self,id=BAD,reader=False):
  if reader:return '/reader/mangadex:'+CID+'?sourceId=mangadex&mangaId=mangadex-'+id+'&mangaTitle=POISONED%20TITLE&coverUrl=https%3A%2F%2Funtrusted.example%2Fadult.jpg&chapterNumber=1'
  return '/manga/mangadex-'+id+'?sourceId=mangadex&title=POISONED%20TITLE&coverUrl=https%3A%2F%2Funtrusted.example%2Fadult.jpg'
 def test_boots_without_hook_or_snapshot_errors(self):self.ready();expect(self.page.get_by_role('button',name='Import manga',exact=True)).to_be_visible();self.no_errors()
 def test_missing_bootstrap_refuses_to_start_the_unguarded_export(self):
  self.context.route('**/catalogue-core.js',lambda route:route.abort());self.page.goto(origin+'/library',wait_until='domcontentloaded');expect(self.page.get_by_text('KURO could not start safely',exact=True)).to_be_visible();self.assertFalse(self.page.evaluate("typeof window.__r==='function'"));self.no_errors()
 def test_unverified_provider_cannot_be_enabled_even_with_old_preferences(self):
  self.ready('/providers');self.page.evaluate("()=>{const s=__r(784).useSettingsStore;s.getState().setSourceEnabled('guya',true);s.getState().setAllSourcesEnabled(true);}")
  self.assertFalse(self.page.evaluate("__r(784).useSettingsStore.getState().sourcePreferences.guya.enabled"));self.assertEqual(self.page.evaluate("()=>__r(789).sourceManager.enabled(['guya']).length"),0);self.no_errors()
 def test_directory_has_no_browse_or_platform_link_for_a_restricted_provider(self):
  self.ready('/providers');self.page.get_by_label('Find a provider').fill('Guya');row=self.page.locator('[data-provider-id="guya"]');expect(row.get_by_role('checkbox')).to_be_disabled();expect(row.get_by_role('link')).to_have_count(0);expect(row).to_contain_text('Restricted');self.no_errors()
 def test_unknown_direct_detail_hides_url_title_and_cover(self):
  self.ready(self.direct());expect(self.page.get_by_text('This title is unavailable',exact=True)).to_be_visible();expect(self.page.get_by_text('POISONED TITLE',exact=True)).to_have_count(0)
  self.assertFalse(any('untrusted.example' in url for url in self.requests));self.no_errors();self.page.screenshot(path=str(evidence/'blocked-title-desktop.png'))
 def test_unknown_direct_reader_mounts_no_pages_or_history(self):
  self.ready(self.direct(reader=True));expect(self.page.get_by_text('This title is unavailable',exact=True)).to_be_visible();self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getState().entries.length'),0)
  self.assertFalse(any('/provider/mangadex/pages' in url for url in self.requests));self.no_errors()
 def test_safe_direct_detail_uses_canonical_metadata_instead_of_url_parameters(self):
  self.ready(self.direct(MID));expect(self.page.get_by_text('An approved adventure.',exact=True)).to_be_visible();expect(self.page.get_by_text('POISONED TITLE',exact=True)).to_have_count(0);self.no_errors()
 def test_safe_direct_reader_loads_pages_and_canonical_history(self):
  self.ready(self.direct(MID,True));self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/page")&&i.complete&&i.naturalWidth>0)',timeout=15000)
  self.assertEqual(self.page.evaluate("__r(1602).useHistoryStore.getState().entries[0].mangaTitle"),'Mountain Friends');self.no_errors()
 def test_saved_unknown_library_and_history_rows_stay_stored_but_are_hidden(self):
  self.ready();self.page.evaluate("()=>{__r(1249).useLibraryStore.getState().add({id:'guya-OldAdult',sourceId:'guya',title:'POISONED SAVED TITLE',coverUrl:'https://untrusted.example/adult.jpg',genres:[],status:'ONGOING'});__r(1602).useHistoryStore.getState().record({mangaId:'guya-OldAdult',sourceId:'guya',chapterId:'guya:OldAdult~1~7',mangaTitle:'POISONED SAVED TITLE',coverUrl:'https://untrusted.example/adult.jpg',readAt:Date.now()});}")
  expect(self.page.get_by_text('POISONED SAVED TITLE',exact=True)).to_have_count(0);self.assertTrue(self.page.evaluate("!!__r(1249).useLibraryStore.getState().entries['guya-OldAdult']"));self.assertEqual(self.page.evaluate('__r(1249).useLibraryStore.getVisibleState().entries'),{});self.assertEqual(self.page.evaluate('__r(1602).useHistoryStore.getVisibleState().entries'),[]);self.no_errors()
 def test_saved_safe_library_title_is_restored_from_canonical_metadata(self):
  self.ready();self.page.evaluate("()=>__r(1249).useLibraryStore.getState().add({id:'mangadex-"+MID+"',sourceId:'mangadex',title:'POISONED SAVED TITLE',coverUrl:'https://untrusted.example/adult.jpg',genres:[],status:'ONGOING'})")
  expect(self.page.get_by_text('Mountain Friends',exact=True).first).to_be_visible(timeout=15000);expect(self.page.get_by_text('POISONED SAVED TITLE',exact=True)).to_have_count(0);self.no_errors()
 def test_unreviewed_device_file_has_no_preview_and_saves_nothing(self):
  self.ready();self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.locator('#kuro-local-files').set_input_files({'name':'Unknown.png','mimeType':'image/png','buffer':image})
  expect(self.page.locator('.kuro-local-error')).to_contain_text('has not been reviewed',timeout=15000);expect(self.page.locator('.kuro-local-draft img')).to_have_count(0);self.assertEqual(self.page.evaluate('()=>KuroCatalogueCore.local.db.list().then(x=>x.length)'),0);self.no_errors()
 def test_reviewed_device_sample_imports_and_reads_with_progress(self):
  self.ready();self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.locator('#kuro-local-files').set_input_files(str(root/'tests/fixtures/safe-device-demo.cbz'))
  expect(self.page.get_by_role('button',name='Add to library',exact=True)).to_be_enabled(timeout=15000);self.page.get_by_label('Manga title',exact=True).fill('A Quiet World');self.page.get_by_role('button',name='Add to library',exact=True).click();expect(self.page.locator('#kuro-local-result')).to_contain_text('Added')
  self.page.get_by_role('button',name='Read now',exact=True).click();self.page.wait_for_function('()=>[...document.images].some(i=>i.src.startsWith("blob:")&&i.complete&&i.naturalWidth===1000)',timeout=15000);self.no_errors()
 def test_device_pages_are_checked_again_on_the_exact_display_snapshot(self):
  self.ready();self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.locator('#kuro-local-files').set_input_files(str(root/'tests/fixtures/safe-device-demo.cbz'))
  expect(self.page.get_by_role('button',name='Add to library',exact=True)).to_be_enabled(timeout=15000);self.page.get_by_role('button',name='Add to library',exact=True).click();expect(self.page.locator('#kuro-local-result')).to_contain_text('Added')
  result=self.page.evaluate("""async()=>{const r=KuroCatalogueCore.local,original=r.db.pages,b=r.books[0];let reads=0;r.db.pages=async id=>{const pages=await original(id);reads++;if(reads===2)return pages.map(p=>({...p,blob:new Blob(['unreviewed bytes']),hash:undefined}));return pages;};try{await r.adapter.getChapterPages(b.id+'-chapter-1');return {allowed:true,reads};}catch(e){return {allowed:false,reads,error:e.message};}finally{r.db.pages=original;}}""")
  self.assertFalse(result['allowed']);self.assertEqual(result['reads'],2);self.assertIn('not been reviewed',result['error']);self.no_errors()
 def test_unreviewed_existing_device_files_are_hidden_and_preserved(self):
  self.ready();result=self.page.evaluate("""async()=>{const id='local-'+'0'.repeat(64),blob=new Blob(['unreviewed bytes']);await new Promise((resolve,reject)=>{const req=indexedDB.open('kuro-device-manga-v1',1);req.onsuccess=()=>{const tx=req.result.transaction(['books','pages'],'readwrite');tx.objectStore('books').put({id,title:'POISONED DEVICE TITLE',cover:blob,pageCount:1,size:blob.size,format:'PNG',createdAt:Date.now()});tx.objectStore('pages').put({bookId:id,index:0,blob});tx.oncomplete=()=>{req.result.close();resolve();};tx.onabort=()=>reject(tx.error);};});await KuroCatalogueCore.local.refresh();return {visible:KuroCatalogueCore.local.books.length,hidden:KuroCatalogueCore.local.hiddenCount,stored:!!await KuroCatalogueCore.local.db.get(id)};}""")
  self.assertEqual(result,{'visible':0,'hidden':1,'stored':True});self.page.get_by_role('button',name='Import manga',exact=True).click();expect(self.page.get_by_text('POISONED DEVICE TITLE',exact=True)).to_have_count(0);expect(self.page.get_by_text('1 unverified device comic is hidden.',exact=False)).to_be_visible();self.no_errors()
 def test_mobile_blocked_page_fits_and_has_no_artwork(self):
  self.page.set_viewport_size({'width':390,'height':844});self.ready(self.direct());expect(self.page.get_by_text('This title is unavailable',exact=True)).to_be_visible();self.assertLessEqual(self.page.locator('.kuro-content-state').evaluate('(e)=>e.scrollWidth'),390);self.page.screenshot(path=str(evidence/'blocked-title-mobile.png'));self.no_errors()
 def test_source_cover_resolver_refuses_unapproved_remote_and_blob_urls(self):
  self.ready();values=self.page.evaluate("()=>['https://untrusted.example/adult.jpg','blob:unknown','https://uploads.mangadex.org/covers/"+BAD+"/adult.jpg'].map(v=>__r(862).resolveImageSource(v).uri)")
  self.assertTrue(values[0].startswith('data:'));self.assertTrue(values[1].startswith('data:'));self.assertIn('/api/catalogue/cover?',values[2]);self.no_errors()

if __name__=='__main__':unittest.main(verbosity=2)
