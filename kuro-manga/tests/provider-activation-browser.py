import importlib.util,json,unittest,os
from pathlib import Path
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('activation_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)

class ProviderActivationBrowser(fixture.StrictContentBrowser):
 def setUp(self):
  super().setUp()
  baseline=os.environ.get('KURO_ACTIVATION_BASELINE')
  if baseline:
   for name in ['catalogue-core.js','provider-directory.js']:
    self.context.route('**/'+name,lambda route,request,name=name:route.fulfill(content_type='text/javascript',body=(Path(baseline)/name).read_bytes()))
 # Reuse the controlled server/transport fixtures, not the parent test cases.
 def test_comix_control_is_disabled_and_explains_the_missing_connection(self):
  self.ready('/providers');self.page.get_by_label('Find a provider',exact=True).fill('Comix');row=self.page.locator('[data-provider-id="comix"]');expect(row.get_by_role('checkbox')).to_be_disabled();expect(row.get_by_role('checkbox')).not_to_be_checked();expect(row).to_contain_text('Connection unavailable');expect(row.get_by_role('link',name='Browse',exact=True)).to_have_count(0);self.no_errors()
 def test_bulk_enable_turns_on_only_the_two_usable_remote_connections(self):
  self.ready('/providers');self.page.evaluate('__r(784).useSettingsStore.getState().setAllSourcesEnabled(true)');ids=self.page.evaluate('()=>KuroCatalogueCore.registry.providers.filter(p=>__r(784).useSettingsStore.getState().sourcePreferences[p.id]?.enabled).map(p=>p.id).sort()');self.assertEqual(ids,['anilist','mangadex']);self.no_errors()
 def old_comix(self,path):
  self.ready('/providers');key=self.page.evaluate('__r(784).useSettingsStore.persist.getOptions().name')
  preferences={p['id']:{'enabled':p['id']=='comix','selectionVersion':1} for p in fixture.registry['providers']};preferences['local']={'enabled':False}
  self.page.evaluate('(value)=>__r(894).kv.set(value.key,JSON.stringify({state:{sourcePreferences:value.preferences},version:1}))',{'key':key,'preferences':preferences})
  self.ready(path)
 def test_legacy_comix_only_home_explains_the_problem_without_enabling_another_source(self):
  self.old_comix('/');expect(self.page.get_by_text('No online reader is On',exact=True)).to_be_visible();expect(self.page.get_by_text('Comix',exact=False).first).to_be_visible();expect(self.page.get_by_role('button',name='Turn on MangaDex',exact=True)).to_be_visible();self.assertFalse(self.page.evaluate('__r(784).useSettingsStore.getState().sourcePreferences.mangadex.enabled'));self.assertEqual(self.page.locator('img[src*="/api/catalogue/cover"]').count(),0);self.no_errors()
 def test_search_recovery_enables_mangadex_only_after_the_user_clicks(self):
  self.old_comix('/search');expect(self.page.get_by_text('No online reader is On',exact=True)).to_be_visible();self.context.clear_cookies();self.page.get_by_role('button',name='Turn on MangaDex',exact=True).click();expect(self.page.get_by_text('Mountain Friends',exact=True).first).to_be_visible(timeout=10000);prefs=self.page.evaluate('__r(784).useSettingsStore.getState().sourcePreferences');self.assertTrue(prefs['mangadex']['enabled']);self.assertFalse(prefs['anilist']['enabled']);self.assertFalse(prefs['comix']['enabled']);self.no_errors()
 def test_metadata_only_selection_is_explained_as_information_without_reading_pages(self):
  self.ready('/providers');self.page.evaluate('()=>{const s=__r(784).useSettingsStore.getState();s.setAllSourcesEnabled(false);s.setSourceEnabled("anilist",true)}');self.ready('/');expect(self.page.get_by_text('No online reader is On',exact=True)).to_be_visible();expect(self.page.get_by_text('AniList supplies catalogue information, not reading pages.',exact=True)).to_be_visible();self.no_errors()
 def test_external_platform_has_a_visit_link_without_an_active_reader_switch(self):
  self.ready('/providers');self.page.get_by_label('Find a provider',exact=True).fill('MANGA Plus');row=self.page.locator('[data-provider-id="mangaplus"]');expect(row.get_by_role('checkbox')).to_be_disabled();expect(row.get_by_role('checkbox')).not_to_be_checked();expect(row.get_by_role('link',name='Visit platform ↗')).to_have_attribute('href','https://mangaplus.shueisha.co.jp/');self.no_errors()
 def test_no_source_state_fits_mobile_and_settings_navigation_is_available(self):
  self.page.set_viewport_size({'width':390,'height':844});self.old_comix('/');expect(self.page.get_by_text('No online reader is On',exact=True)).to_be_visible();expect(self.page.get_by_role('button',name='Manage providers',exact=True)).to_be_visible();self.assertLessEqual(self.page.locator('body').evaluate('(e)=>e.scrollWidth'),390);self.no_errors()
 def test_settings_does_not_offer_switches_for_unusable_connections(self):
  self.ready('/settings');expect(self.page.get_by_text('Guya.moe',exact=True)).to_have_count(0);expect(self.page.get_by_text('MangaDex',exact=True)).to_be_visible();self.no_errors()
 def test_old_comix_search_link_requires_an_explicit_choice_even_with_mangadex_on(self):
  self.ready('/providers');self.page.evaluate('()=>{const s=__r(784).useSettingsStore.getState();s.setAllSourcesEnabled(false);s.setSourceEnabled("mangadex",true)}');self.ready('/search?source=comix&q=Mountain');expect(self.page.get_by_text('No reader for this source',exact=True)).to_be_visible();expect(self.page.get_by_role('button',name='Use MangaDex',exact=True)).to_be_visible();self.assertEqual(self.page.locator('img[src*="/api/catalogue/cover"]').count(),0);self.context.clear_cookies();self.page.get_by_role('button',name='Use MangaDex',exact=True).click();expect(self.page.get_by_text('Mountain Friends',exact=True).first).to_be_visible(timeout=10000);self.assertIn('source=mangadex',self.page.url);self.assertIn('q=Mountain',self.page.url);self.no_errors()
 def test_usable_source_off_choice_survives_reload_and_keyboard_activation(self):
  self.ready('/providers');self.page.get_by_label('Find a provider',exact=True).fill('MangaDex');control=self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox');expect(control).to_be_checked();control.focus();control.press('Space');expect(control).not_to_be_checked();self.ready('/providers');self.page.get_by_label('Find a provider',exact=True).fill('MangaDex');control=self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox');expect(control).not_to_be_checked();control.focus();control.press('Space');expect(control).to_be_checked();self.ready('/providers');self.page.get_by_label('Find a provider',exact=True).fill('MangaDex');expect(self.page.locator('[data-provider-id="mangadex"]').get_by_role('checkbox')).to_be_checked();self.no_errors()

# Only run this class's new cases; the inherited safety cases have their
# own suite and remain part of the full release run.
if __name__=='__main__':
 suite=unittest.TestSuite(ProviderActivationBrowser(name) for name in ProviderActivationBrowser.__dict__ if name.startswith('test_'))
 result=unittest.TextTestRunner(verbosity=2).run(suite)
 raise SystemExit(0 if result.wasSuccessful() else 1)
