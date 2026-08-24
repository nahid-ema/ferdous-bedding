from playwright.sync_api import sync_playwright

def test_menu():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Bypass auth
        page.evaluate("document.getElementById('authContainer').classList.add('hidden');")
        page.evaluate("document.getElementById('appContainer').classList.remove('hidden');")
        page.evaluate("storeData = JSON.parse(localStorage.getItem('asifBeddingData_local')) || {}; updateUI();")
        page.wait_for_timeout(500)

        # Verify the menu is hidden initially
        dropdown = page.locator("#dropdownMenu")
        assert not dropdown.is_visible()

        # Click the toggle button using force because it might be considered not fully visible
        # or playwright can't find it normally due to its container constraints
        menu_btn = page.locator("#menuToggleBtn")
        menu_btn.click(force=True)
        page.wait_for_timeout(500)

        # Verify menu opens
        page.wait_for_selector("#dropdownMenu", state="visible")
        assert dropdown.is_visible()

        # Verify elements are inside the menu
        assert page.locator("#dropdownMenu #syncStatus").is_visible()
        assert page.locator("#dropdownMenu button:has-text('ব্যাকআপ ডাউনলোড')").is_visible()
        assert page.locator("#dropdownMenu label:has-text('ফাইল রিস্টোর')").is_visible()
        assert page.locator("#dropdownMenu button:has-text('লগআউট')").is_visible()

        # Click outside to close
        page.mouse.click(10, 10)
        page.wait_for_timeout(500)
        # Verify menu is hidden
        assert not dropdown.is_visible()

        print("Menu functionality tested successfully.")
        browser.close()

if __name__ == "__main__":
    test_menu()
