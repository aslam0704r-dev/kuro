import importlib.util
import time
import unittest
from pathlib import Path
from urllib.parse import urlparse,parse_qs
spec=importlib.util.spec_from_file_location('strict_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)

class CataloguePerformanceBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):fixture.StrictContentBrowser.setUpClass.__func__(cls)
 @classmethod
 def tearDownClass(cls):fixture.StrictContentBrowser.tearDownClass.__func__(cls)
 setUp=fixture.StrictContentBrowser.setUp
 tearDown=fixture.StrictContentBrowser.tearDown
 ready=fixture.StrictContentBrowser.ready
 no_errors=fixture.StrictContentBrowser.no_errors

 def api(self,route):
  parsed=urlparse(route.request.url);q=parse_qs(parsed.query)
  if parsed.path.endswith('/mangadex'):
   upstream=urlparse(q.get('path',[''])[0])
   if upstream.path=='/manga':
    now=int(time.time()*1000);raw=fixture.raw();raw['kuroReadabilityAsOf']=now
    raw['kuroReadability']={'ready':True,'mangaId':'mangadex-'+fixture.MID,'chapterId':'mangadex:'+fixture.CID,'version':'complete-chapter-1','policyVersion':'strict-1','validation':'complete-chapter','validatedPages':3,'pageCount':3,'checkedAt':now,'expiresAt':now+3600000}
    raw['kuroReadability'].update(getattr(self,'proof_patch',{}))
    route.fulfill(json={'result':'ok','data':[raw],'limit':20,'offset':0,'total':1});return
   if upstream.path.endswith('/feed') and getattr(self,'reject_fallback',False):route.fulfill(json={'result':'ok','data':[],'total':0});return
  if parsed.path.endswith('/readable/qualify'):
   self.readiness_calls.append(parsed.query);now=int(time.time()*1000)
   route.fulfill(json={'ready':False,'pending':False,'policyVersion':'strict-1','manga':fixture.manga(),'asOf':now,'inventoryRevision':0});return
  if parsed.path.endswith('/readable/check'):
   self.readiness_calls.append(parsed.query);route.fulfill(json={'ready':False});return
  return fixture.StrictContentBrowser.api(self,route)

 def warm(self,path):
  self.readiness_calls=[];start=time.monotonic();self.ready(path)
  self.page.wait_for_function('()=>[...document.images].some(i=>i.src.includes("/api/catalogue/cover")&&i.complete&&i.naturalWidth>1)',timeout=8000)
  self.page.wait_for_load_state('networkidle')
  self.assertEqual(self.readiness_calls,[])
  self.assertFalse(any('/provider/mangadex/pages' in request for request in self.requests))
  self.no_errors();print('Warm ready cover:',path,round((time.monotonic()-start)*1000),'ms; no per-title readiness or chapter calls')

 def test_home_renders_ready_titles_without_chapter_round_trips(self):self.warm('/')
 def test_archive_renders_ready_titles_without_chapter_round_trips(self):self.warm('/search')
 def invalid(self,patch):
  self.proof_patch=patch;self.reject_fallback=True;self.readiness_calls=[];self.ready('/search');self.page.wait_for_load_state('networkidle')
  self.assertGreater(len(self.readiness_calls),0)
  self.assertEqual(self.page.locator('img[src*="/api/catalogue/cover"]').count(),0);self.no_errors()
 def test_expired_inline_proof_cannot_show_a_title(self):self.invalid({'expiresAt':int(time.time()*1000)-1})
 def test_another_titles_inline_proof_cannot_show_a_title(self):self.invalid({'mangaId':'mangadex-'+fixture.BAD})

if __name__=='__main__':unittest.main(verbosity=2)
