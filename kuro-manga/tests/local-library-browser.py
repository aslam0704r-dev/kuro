import importlib.util,unittest
from pathlib import Path
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('strict_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
class DeviceLibraryBrowser(unittest.TestCase):
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
 def prepare(self,reverse=False):
  self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.locator('#kuro-local-files').set_input_files(str(fixture.root/'tests/fixtures/safe-device-demo.cbz'));expect(self.page.get_by_role('button',name='Add to library',exact=True)).to_be_enabled(timeout=20000)
  if reverse:self.page.get_by_label('Reverse page order',exact=True).check()
 def save(self,title='A Quiet World'):
  self.page.get_by_label('Manga title',exact=True).fill(title);self.page.get_by_role('button',name='Add to library',exact=True).click();expect(self.page.locator('#kuro-local-result')).to_contain_text('library',timeout=15000)
 def test_keyboard_can_close_import(self):
  self.ready();self.prepare();self.page.keyboard.press('Escape');expect(self.page.get_by_role('dialog',name='Import manga')).not_to_be_visible();self.no_errors()
 def test_reviewed_import_and_reader_reload_keep_the_pages(self):
  self.ready();self.prepare();self.save();self.page.get_by_role('button',name='Read now',exact=True).click();self.page.wait_for_function('()=>[...document.images].some(i=>i.src.startsWith("blob:")&&i.naturalWidth===1000)');self.page.reload(wait_until='domcontentloaded');self.page.wait_for_function('()=>[...document.images].some(i=>i.src.startsWith("blob:")&&i.naturalWidth===1000)');self.no_errors()
 def test_duplicate_import_preserves_reading_status(self):
  self.ready();self.prepare();self.save();self.page.get_by_role('button',name='Back to library',exact=True).click();self.page.evaluate("()=>{const b=KuroCatalogueCore.local.books[0];__r(1249).useLibraryStore.getState().setReadingStatus(b.id,'COMPLETED');}");self.prepare();self.save('Another name');expect(self.page.locator('#kuro-local-result')).to_contain_text('Already imported');self.assertEqual(self.page.evaluate('KuroCatalogueCore.local.books.length'),1);self.assertEqual(self.page.evaluate("()=>Object.values(__r(1249).useLibraryStore.getState().entries)[0].readingStatus"),'COMPLETED');self.no_errors()
 def test_reversed_reviewed_pages_are_a_separate_ordered_book(self):
  self.ready();self.prepare();self.save();self.page.get_by_role('button',name='Back to library',exact=True).click();self.prepare(True);self.save('Reverse');self.assertEqual(self.page.evaluate('KuroCatalogueCore.local.books.length'),2);self.no_errors()
 def test_title_markup_is_rendered_as_text(self):
  self.ready();self.prepare();self.save('<b>My book</b>');self.assertEqual(self.page.locator('#kuro-local-result b').count(),0);expect(self.page.locator('#kuro-local-result')).to_contain_text('<b>My book</b>');self.no_errors()
 def test_adult_title_label_is_refused_even_for_a_reviewed_file(self):
  self.ready();self.prepare();self.page.get_by_label('Manga title',exact=True).fill('Hentai collection');self.page.get_by_role('button',name='Add to library',exact=True).click();expect(self.page.locator('.kuro-local-error')).to_contain_text('strict content rules');self.assertEqual(self.page.evaluate('()=>KuroCatalogueCore.local.db.list().then(x=>x.length)'),0);self.no_errors()
 def test_cancel_leaves_no_partial_book(self):
  held=[];self.context.route('**/local-archive-worker.js',lambda r:held.append(r));self.ready();self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.locator('#kuro-local-files').set_input_files(str(fixture.root/'tests/fixtures/safe-device-demo.cbz'));self.page.get_by_role('button',name='Cancel import',exact=True).click();expect(self.page.locator('.kuro-local-error')).to_contain_text('No book');self.assertEqual(self.page.evaluate('()=>KuroCatalogueCore.local.db.list().then(x=>x.length)'),0)
  for r in held:r.abort()
  self.no_errors()
 def test_mobile_import_fits(self):
  self.page.set_viewport_size({'width':390,'height':844});self.ready();self.prepare();self.assertLessEqual(self.page.locator('#kuro-local-dialog').evaluate('(e)=>e.scrollWidth'),370);self.no_errors()
 def test_local_import_uploads_no_manga_bytes(self):
  writes=[];self.context.on('request',lambda r:writes.append(r.url) if r.method not in ['GET','HEAD'] else None);self.ready();self.prepare();self.save();self.assertEqual(writes,[]);self.no_errors()
 def test_two_tabs_keep_a_hidden_existing_provider_bookmark(self):
  self.ready();second=self.context.new_page();second.goto(fixture.origin+'/library',wait_until='domcontentloaded');second.wait_for_function('()=>window.KuroCatalogue?.ready');self.page.evaluate("()=>__r(1249).useLibraryStore.getState().add({id:'guya-kept',sourceId:'guya',title:'Stored entry',genres:[],status:'ONGOING'})");self.prepare();self.save();second.wait_for_function('()=>KuroCatalogueCore.local.books.length===1');second.evaluate('()=>__r(1249).useLibraryStore.persist.rehydrate()');self.assertTrue(second.evaluate("!!__r(1249).useLibraryStore.getState().entries['guya-kept']"));second.close();self.no_errors()
 def test_deleting_device_copy_keeps_other_saved_entries(self):
  self.ready();self.prepare();self.save();self.page.evaluate("async()=>{__r(1249).useLibraryStore.getState().add({id:'guya-kept',sourceId:'guya',title:'Stored entry',genres:[],status:'ONGOING'});await KuroCatalogueCore.local.delete(KuroCatalogueCore.local.books[0].id);}");self.assertEqual(self.page.evaluate('KuroCatalogueCore.local.books.length'),0);self.assertTrue(self.page.evaluate("!!__r(1249).useLibraryStore.getState().entries['guya-kept']"));self.no_errors()
 def test_removing_bookmark_can_be_restored_from_approved_files(self):
  self.ready();self.prepare();self.save();self.page.get_by_role('button',name='Back to library',exact=True).click();self.page.evaluate("()=>__r(1249).useLibraryStore.getState().remove(KuroCatalogueCore.local.books[0].id)");self.page.get_by_role('button',name='Import manga',exact=True).click();self.page.get_by_role('button',name='Add A Quiet World to library',exact=False).click();expect(self.page.get_by_role('button',name='Add A Quiet World to library',exact=False)).to_have_count(0);self.no_errors()
if __name__=='__main__':unittest.main(verbosity=2)
