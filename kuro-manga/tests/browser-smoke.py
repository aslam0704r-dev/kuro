import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get("APP_URL", "http://localhost:8081")
evidence = Path(__file__).parent.parent / "work" / "browser-evidence"
evidence.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    options = {"headless": True}
    if os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
        options["executable_path"] = os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]
    browser = p.chromium.launch(**options)
    def page_for(context):
        page = context.new_page()
        # Reproduce the screenshot's missing-offer state. Synthetic handoff events still reach the app.
        page.add_init_script("window.addEventListener('beforeinstallprompt', e => { if (e.isTrusted) e.stopImmediatePropagation(); }, true);")
        page.route("**/__proxy?*", lambda route: route.fulfill(status=503, content_type="text/plain", body="Test source unavailable"))
        page.route("https://**/*", lambda route: route.fulfill(status=503, body="External content excluded from the UI smoke test"))
        return page
    errors = []
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = page_for(context)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(origin, wait_until="networkidle")
    print("Rendered:", json.dumps(page.locator("body").inner_text()[:700]))
    expect(page.locator("#kuro-install[open]")).to_be_visible(timeout=10000)
    page.evaluate("document.fonts.ready")
    font_status = page.evaluate("Array.from(document.fonts).map(f => ({family:f.family,status:f.status}))")
    print("Fonts:", json.dumps(font_status))
    assert any(f["family"].lower().find("ionicons") >= 0 and f["status"] == "loaded" for f in font_status)
    for response_url in ["/manifest.webmanifest", "/icons/kuro-192.png", "/icons/kuro-512.png", "/sw.js"]:
        assert page.request.get(origin + response_url).status == 200, response_url
    page.screenshot(path=str(evidence / "desktop-install.png"))
    install = page.get_by_role("button", name="Install KURO", exact=True)
    expect(install).to_be_visible(timeout=3000)
    install.click()
    expect(page.locator("#kuro-install-help")).to_be_visible()
    assert "Open in app" in page.locator("#kuro-install-help").inner_text()
    assert page.evaluate("window.fixturePromptCalls") is None
    page.get_by_role("button", name="Hide instructions", exact=True).click()
    expect(page.locator("#kuro-install-help")).to_be_hidden()
    page.get_by_role("button", name="Not now", exact=True).click()
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(3800)
    expect(page.locator("#kuro-install[open]")).to_have_count(0)
    page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
    expect(page.locator("#kuro-install[open]")).to_be_visible()
    page.evaluate("""() => {
      const event = new Event('beforeinstallprompt');
      event.prompt = async () => { window.fixturePromptCalls = (window.fixturePromptCalls || 0) + 1; };
      event.userChoice = Promise.resolve({outcome:'accepted'});
      window.dispatchEvent(event);
    }""")
    page.get_by_role("button", name="Install KURO", exact=True).click()
    page.wait_for_timeout(1500)
    expect(page.locator("#kuro-install[open]")).to_have_count(0)
    assert page.evaluate("window.fixturePromptCalls") == 1
    page.goto(origin + "/account", wait_until="networkidle")
    expect(page.get_by_text("Continue with Google", exact=True)).to_be_visible()
    print("Page errors:", json.dumps(errors))
    assert not errors
    context.close()

    context = browser.new_context(viewport={"width": 390, "height": 844})
    context.add_init_script("delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close;")
    page = page_for(context)
    page.goto(origin, wait_until="networkidle")
    expect(page.locator("#kuro-install[open]")).to_be_visible(timeout=10000)
    page.screenshot(path=str(evidence / "mobile-fallback-install.png"))
    page.get_by_role("button", name="Install KURO", exact=True).click()
    expect(page.locator("#kuro-install-help")).to_be_visible()
    page.get_by_role("button", name="Hide instructions", exact=True).click()
    page.keyboard.press("Tab")
    assert page.evaluate("!!document.activeElement.closest('#kuro-install')")
    page.keyboard.press("Escape")
    expect(page.locator("#kuro-install[open]")).to_have_count(0)
    page.evaluate("window.dispatchEvent(new Event('kuro-install'))")
    expect(page.locator("#kuro-install[open]")).to_be_visible()
    page.get_by_role("button", name="Not now", exact=True).click()
    expect(page.locator("#kuro-install[open]")).to_have_count(0)
    context.close()

    context = browser.new_context()
    context.add_init_script("Object.defineProperty(navigator, 'standalone', {get: () => true});")
    page = page_for(context)
    page.goto(origin, wait_until="networkidle")
    page.wait_for_timeout(3800)
    expect(page.locator("#kuro-install")).to_have_count(0)
    page.evaluate("navigator.serviceWorker.ready")
    page.reload(wait_until="networkidle")
    context.set_offline(True)
    page.goto(origin + "/library", wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name=re.compile("offline", re.I))).to_be_visible()
    context.close()

    context = browser.new_context()
    page = page_for(context)
    page.route("**/api/auth/session", lambda route: route.fulfill(json={"configured":True, "user":None, "recovery":False, "challenge":None}))
    page.route("**/api/auth/google", lambda route: route.fulfill(json={"url":"https://fixture.supabase.co/auth/v1/authorize?provider=google&fixture=1"}))
    page.route("https://fixture.supabase.co/**", lambda route: route.fulfill(content_type="text/html", body="<h1>OAuth handoff fixture</h1>"))
    page.goto(origin + "/account", wait_until="networkidle")
    page.get_by_role("button", name="Continue with Google", exact=True).click()
    page.wait_for_url("https://fixture.supabase.co/**")
    expect(page.get_by_role("heading", name="OAuth handoff fixture")).to_be_visible()
    context.close()
    browser.close()
report = {"passed": True, "page_errors": errors, "fonts": font_status,
          "checks": ["PWA resources", "first-visit dialog", "install action without native offer", "dismissal", "re-entry", "prompt handoff",
                     "mobile fallback", "focus trap", "Escape", "standalone suppression", "offline navigation", "Google UI handoff"]}
(evidence / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf8")
print("Browser smoke passed:", ", ".join(report["checks"]))
