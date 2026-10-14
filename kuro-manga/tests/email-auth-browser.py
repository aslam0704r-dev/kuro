import os,unittest
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
origin=os.environ.get('APP_URL','http://127.0.0.1:4184')
evidence=Path(__file__).parent.parent/'work/email-auth-evidence';evidence.mkdir(parents=True,exist_ok=True)
class EmailAuthBrowser(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True)
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.context.route('https://**/*',lambda r:r.fulfill(status=503));self.page.goto(origin+'/account',wait_until='networkidle')
 def tearDown(self):self.context.close()
 def test_desktop_and_mobile_have_two_email_methods_and_no_phone(self):
  for width in [1280,390]:
   self.page.set_viewport_size({'width':width,'height':900});expect(self.page.get_by_role('tab')).to_have_count(2);expect(self.page.get_by_role('tab',name='Password login')).to_be_visible();expect(self.page.get_by_role('tab',name='Email OTP login')).to_be_visible();expect(self.page.get_by_text('MOBILE OTP',exact=True)).to_have_count(0);expect(self.page.get_by_text('Mobile number',exact=True)).to_have_count(0);self.assertNotIn('SMS',self.page.locator('body').inner_text());self.assertEqual(self.errors,[])
  self.page.screenshot(path=str(evidence/'email-login-mobile.png'))
 def test_email_code_signin_preserves_verified_account_and_profile(self):
  self.page.get_by_role('tab',name='Email OTP login').click();self.page.get_by_role('textbox',name='Email address',exact=True).fill('email-browser-44@example.com');self.page.get_by_text('Send verification code',exact=True).click();expect(self.page.get_by_text('CHECK YOUR CODE.',exact=True)).to_be_visible();self.page.get_by_role('textbox',name='Verification code',exact=True).fill('654321');self.page.get_by_text('Verify code',exact=True).click();expect(self.page.locator('#kuro-profile-launch')).to_be_visible();self.assertNotIn('phone',self.page.locator('body').inner_text().lower());self.assertEqual(self.errors,[])
 def test_signup_and_email_recovery_fields_remain_available(self):
  self.page.get_by_text('New here? Create an account',exact=True).click();expect(self.page.get_by_role('textbox',name='Display name',exact=True)).to_be_visible();expect(self.page.get_by_role('textbox',name='Email address',exact=True)).to_be_visible();expect(self.page.get_by_text('Create account',exact=True)).to_be_visible();self.page.get_by_text('Back to sign in',exact=True).click();self.page.get_by_text('Forgot password?',exact=True).click();expect(self.page.get_by_text('RECOVER YOUR ACCOUNT.',exact=True)).to_be_visible();expect(self.page.get_by_role('textbox',name='Email address',exact=True)).to_be_visible();self.assertEqual(self.errors,[])
 def test_unconfigured_notice_mentions_only_email_and_google(self):
  self.context.route('**/api/auth/session',lambda r:r.fulfill(json={'configured':False,'user':None,'challenge':None,'recovery':False}));self.page.reload(wait_until='networkidle');expect(self.page.get_by_text('SETUP REQUIRED',exact=True)).to_be_visible();self.assertNotIn('SMS',self.page.locator('body').inner_text());expect(self.page.get_by_text('Continue with Google',exact=True)).to_be_visible();self.assertEqual(self.errors,[])
if __name__=='__main__':unittest.main(verbosity=2)
