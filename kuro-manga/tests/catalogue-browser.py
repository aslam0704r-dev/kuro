import importlib.util,unittest
from pathlib import Path
from playwright.sync_api import expect
spec=importlib.util.spec_from_file_location('strict_fixture',Path(__file__).with_name('content-browser.py'))
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
class CatalogueBrowser(fixture.StrictContentBrowser):
 """Current strict catalogue regression suite; uses positive rating fixtures."""
 pass
if __name__=='__main__':unittest.main(verbosity=2)
