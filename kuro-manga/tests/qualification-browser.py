import importlib.util,time,unittest
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import expect

spec=importlib.util.spec_from_file_location('content_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)

class QualificationBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):fixture.StrictContentBrowser.setUpClass.__func__(cls)
 @classmethod
 def tearDownClass(cls):fixture.StrictContentBrowser.tearDownClass.__func__(cls)
 def setUp(self):
  fixture.StrictContentBrowser.setUp(self);self.qualify_calls=0;self.pending=False;self.invalid=False;self.limited=False;self.reader_pending=False
 tearDown=fixture.StrictContentBrowser.tearDown
 ready=fixture.StrictContentBrowser.ready
 no_errors=fixture.StrictContentBrowser.no_errors
 def api(self,route):
  path=urlparse(route.request.url).path
  if path.endswith('/providers'):
   route.fulfill(json={**fixture.registry,'providers':[{**p,'qualificationVersion':1 if p['id']=='mangadex' else 0,'available':p['id'] in ['mangadex','anilist'],'contentPolicy':{'state':'eligible' if p['id'] in ['mangadex','anilist'] else 'restricted'}} for p in fixture.registry['providers']]});return
  if path.endswith('/readable/qualify'):
   self.qualify_calls+=1;self.requests.append(path)
   if self.limited:route.fulfill(status=429,headers={'Retry-After':'60'},json={'error':'Source rate limit reached'});return
   if self.pending and self.qualify_calls==1:route.fulfill(json={'ready':False,'pending':True,'policyVersion':'strict-1','validatedPages':2,'pageCount':3});return
   now=int(time.time()*1000)
   route.fulfill(json={'ready':True,'pending':False,'policyVersion':'strict-1','manga':fixture.manga(),'chapterId':'mangadex:'+fixture.CID,'validation':'complete-chapter','validatedPages':2 if self.invalid else 3,'pageCount':3,'checkedAt':now,'expiresAt':now+3600000,'asOf':now,'inventoryRevision':1});return
  if path.endswith('/provider/mangadex/pages') and self.reader_pending:
   route.fulfill(json={'result':{'chapterId':'mangadex:'+fixture.CID,'verified':False,'pending':True,'validation':'complete-chapter','validatedPages':1,'pageCount':3,'pages':[],'contentApproval':{'version':'strict-1'}}});return
  return fixture.StrictContentBrowser.api(self,route)
 def render(self,path):
  started=time.monotonic();self.ready(path)
  self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/cover")&&i.complete&&i.naturalWidth>1)',timeout=10000)
  self.assertEqual(self.qualify_calls,1)
  self.assertFalse(any('/readable/check' in p or '/provider/mangadex/pages' in p or '/content/check' in p for p in self.requests))
  self.no_errors();print('Cold qualification fixture:',path,round((time.monotonic()-started)*1000),'ms; one combined request')
 def test_cold_home_shows_a_verified_cover_after_one_combined_request(self):self.render('/')
 def test_cold_search_shows_a_verified_cover_after_one_combined_request(self):self.render('/search')
 def test_pending_work_resumes_without_showing_partial_chapter_results(self):
  self.pending=True;self.ready('/search')
  self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/cover")&&i.complete&&i.naturalWidth>1)',timeout=10000)
  self.assertEqual(self.qualify_calls,2);self.no_errors()
 def test_an_incomplete_positive_proof_cannot_display_a_cover(self):
  self.invalid=True;self.ready('/search');self.page.wait_for_load_state('networkidle')
  self.assertGreater(self.qualify_calls,0);self.assertEqual(self.page.locator('img[src*="/api/catalogue/cover"]').count(),0);self.no_errors()
 def test_rate_limits_pause_qualification_without_a_retry_storm(self):
  self.limited=True;self.ready('/search');self.page.wait_for_load_state('networkidle');self.page.wait_for_timeout(1200)
  self.assertEqual(self.qualify_calls,1);self.assertEqual(self.page.locator('img[src*="/api/catalogue/cover"]').count(),0);self.no_errors()
 def test_pending_reader_has_a_retry_that_resumes_verification(self):
  self.reader_pending=True
  path='/reader/mangadex:'+fixture.CID+'?sourceId=mangadex&mangaId=mangadex-'+fixture.MID+'&chapterNumber=1'
  self.ready(path);expect(self.page.get_by_text('This chapter is still preparing',exact=True)).to_be_visible(timeout=15000)
  self.assertEqual(self.page.locator('img[src*="/api/catalogue/page"]').count(),0)
  self.reader_pending=False;self.page.get_by_role('button',name='Retry check',exact=True).click()
  self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/page")&&i.complete&&i.naturalWidth>1)',timeout=10000);self.no_errors()

if __name__=='__main__':unittest.main(verbosity=2)
