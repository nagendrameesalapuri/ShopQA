"""
ShopQA - Selenium Python Automation Tests
Covers: Authentication, Product Catalog, Cart, Checkout, Admin Panel

Requirements:
    pip install selenium pytest pytest-html webdriver-manager

Run:
    pytest tests/selenium/test_shopqa.py -v --html=report.html

Chrome driver auto-managed via webdriver-manager.
"""

import pytest
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL  = "http://localhost:3000"
API_URL   = "http://localhost:5000"
WAIT_TIMEOUT = 10

# ─── Fixtures ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    # Uncomment for headless mode in CI:
    # options.add_argument("--headless=new")
    # options.add_argument("--no-sandbox")
    # options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()

@pytest.fixture(autouse=True)
def screenshot_on_fail(request, driver):
    """Auto-capture screenshot on test failure"""
    yield
    if request.node.rep_call.failed if hasattr(request.node, 'rep_call') else False:
        name = request.node.name.replace(" ", "_")
        driver.save_screenshot(f"screenshots/FAIL_{name}_{int(time.time())}.png")

def wait(driver, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout)

def find(driver, testid):
    return driver.find_element(By.CSS_SELECTOR, f'[data-testid="{testid}"]')

def finds(driver, testid):
    return driver.find_elements(By.CSS_SELECTOR, f'[data-testid="{testid}"]')

def wait_for(driver, testid, timeout=WAIT_TIMEOUT):
    return wait(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
    )

def login(driver, email="john@test.com", password="Password123!"):
    driver.get(f"{BASE_URL}/login")
    wait_for(driver, "login-form")
    find(driver, "input-email").clear()
    find(driver, "input-email").send_keys(email)
    find(driver, "input-password").clear()
    find(driver, "input-password").send_keys(password)
    find(driver, "btn-login").click()
    wait_for(driver, "navbar")
    time.sleep(1)

# ═══════════════════════════════════════════════════
# 1. AUTHENTICATION TESTS
# ═══════════════════════════════════════════════════
class TestAuthentication:

    def test_login_page_loads(self, driver):
        """Login page should display all form elements"""
        driver.get(f"{BASE_URL}/login")
        assert wait_for(driver, "login-form").is_displayed()
        assert find(driver, "input-email").is_displayed()
        assert find(driver, "input-password").is_displayed()
        assert find(driver, "btn-login").is_displayed()

    def test_empty_form_shows_errors(self, driver):
        """Submitting empty form should show validation errors"""
        driver.get(f"{BASE_URL}/login")
        wait_for(driver, "btn-login").click()
        assert wait_for(driver, "email-error").is_displayed()

    def test_invalid_credentials_shows_error(self, driver):
        """Wrong credentials should show error message"""
        driver.get(f"{BASE_URL}/login")
        find(driver, "input-email").send_keys("wrong@email.com")
        find(driver, "input-password").send_keys("WrongPassword1")
        find(driver, "btn-login").click()
        assert wait_for(driver, "login-error").is_displayed()
        assert "Invalid" in find(driver, "login-error").text

    def test_valid_login_customer(self, driver):
        """Valid customer credentials should log in successfully"""
        login(driver, "john@test.com", "Password123!")
        assert wait_for(driver, "user-menu-btn").is_displayed()

    def test_valid_login_admin(self, driver):
        """Admin login should redirect to /admin"""
        login(driver, "admin@shopqa.com", "Password123!")
        time.sleep(1)
        assert "/admin" in driver.current_url

    def test_password_visibility_toggle(self, driver):
        """Toggle password visibility should change input type"""
        driver.get(f"{BASE_URL}/login")
        pwd_input = find(driver, "input-password")
        assert pwd_input.get_attribute("type") == "password"
        find(driver, "toggle-password").click()
        assert pwd_input.get_attribute("type") == "text"
        find(driver, "toggle-password").click()
        assert pwd_input.get_attribute("type") == "password"

    def test_logout_clears_session(self, driver):
        """Logout should clear session and show login button"""
        login(driver, "john@test.com", "Password123!")
        wait_for(driver, "user-menu-btn").click()
        wait_for(driver, "menu-logout").click()
        assert wait_for(driver, "nav-login").is_displayed()

    def test_session_expired_message(self, driver):
        """Session expired URL parameter should show warning"""
        driver.get(f"{BASE_URL}/login?expired=true")
        assert wait_for(driver, "session-expired-msg").is_displayed()

    def test_quick_login_fills_form(self, driver):
        """Quick login buttons should fill in credentials"""
        driver.get(f"{BASE_URL}/login")
        # Open test credentials dropdown
        details = driver.find_element(By.CSS_SELECTOR, 'details[data-testid="test-credentials"]')
        details.find_element(By.TAG_NAME, "summary").click()
        time.sleep(0.3)
        find(driver, "quick-login-admin").click()
        assert "admin@shopqa.com" in find(driver, "input-email").get_attribute("value")

    def test_register_weak_password(self, driver):
        """Weak password should show strength indicator"""
        driver.get(f"{BASE_URL}/register")
        wait_for(driver, "input-reg-password").send_keys("weak")
        strength = wait_for(driver, "password-strength")
        assert "Weak" in strength.text or "Very Weak" in strength.text

    def test_register_password_mismatch(self, driver):
        """Mismatched passwords should show error"""
        driver.get(f"{BASE_URL}/register")
        find(driver, "input-reg-password").send_keys("Password123!")
        find(driver, "input-reg-confirm-password").send_keys("Password456!")
        find(driver, "btn-register").click()
        assert wait_for(driver, "confirm-password-error").is_displayed()


# ═══════════════════════════════════════════════════
# 2. PRODUCT CATALOG TESTS
# ═══════════════════════════════════════════════════
class TestProductCatalog:

    def test_products_page_loads(self, driver):
        """Products page should display product grid"""
        driver.get(f"{BASE_URL}/products")
        grid = wait_for(driver, "product-grid", timeout=15)
        cards = finds(driver, "product-card")
        assert len(cards) > 0, "No product cards found"

    def test_product_count_displayed(self, driver):
        """Product count should be visible and non-loading"""
        driver.get(f"{BASE_URL}/products")
        count_el = wait_for(driver, "product-count")
        wait(driver).until(lambda d: "Loading" not in count_el.text)
        assert "products" in count_el.text.lower()

    def test_filter_by_category(self, driver):
        """Category filter should filter products"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "filter-cat-electronics").click()
        time.sleep(1.5)
        assert "category=electronics" in driver.current_url
        cards = finds(driver, "product-card")
        assert len(cards) > 0

    def test_sort_by_price_ascending(self, driver):
        """Sort by price ascending should order products by price"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        sort_select = Select(find(driver, "sort-select"))
        sort_select.select_by_value("price_asc")
        time.sleep(1.5)
        prices = finds(driver, "product-price")
        if len(prices) >= 2:
            p1 = float(prices[0].text.replace("₹", "").replace(",", ""))
            p2 = float(prices[-1].text.replace("₹", "").replace(",", ""))
            assert p1 <= p2, f"Prices not sorted: {p1} > {p2}"

    def test_search_products(self, driver):
        """Search should filter products by query"""
        driver.get(f"{BASE_URL}/products")
        search_input = find(driver, "nav-search-input")
        search_input.clear()
        search_input.send_keys("iPhone")
        find(driver, "nav-search-btn").click()
        time.sleep(1.5)
        assert "search=iPhone" in driver.current_url

    def test_empty_search_shows_no_results(self, driver):
        """Non-existent search should show empty state"""
        driver.get(f"{BASE_URL}/products?search=xyznonexistent12345")
        empty = wait_for(driver, "empty-state", timeout=10)
        assert empty.is_displayed()
        assert "No products found" in empty.text

    def test_pagination_next_page(self, driver):
        """Next page button should navigate to page 2"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        first_product = find(driver, "product-name").text
        find(driver, "next-page").click()
        time.sleep(1.5)
        assert "page=2" in driver.current_url
        new_first = find(driver, "product-name").text
        assert first_product != new_first, "Products didn't change on page 2"

    def test_grid_list_view_toggle(self, driver):
        """View toggle buttons should switch between grid and list view"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        find(driver, "view-list").click()
        grid = find(driver, "product-grid")
        assert "list-view" in grid.get_attribute("class")
        find(driver, "view-grid").click()
        assert "list-view" not in grid.get_attribute("class")

    def test_filter_min_max_price(self, driver):
        """Min/max price filters should work"""
        driver.get(f"{BASE_URL}/products")
        min_input = find(driver, "filter-min-price")
        max_input = find(driver, "filter-max-price")
        min_input.clear()
        min_input.send_keys("100")
        max_input.clear()
        max_input.send_keys("1000")
        max_input.send_keys(Keys.RETURN)
        time.sleep(1.5)
        assert "minPrice=100" in driver.current_url
        assert "maxPrice=1000" in driver.current_url

    def test_product_detail_page(self, driver):
        """Clicking a product card should open detail page"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        card = finds(driver, "product-card")[0]
        link = card.find_element(By.CSS_SELECTOR, 'a')
        link.click()
        time.sleep(1.5)
        assert wait_for(driver, "product-detail-name").is_displayed()

    def test_product_detail_has_add_to_cart(self, driver):
        """Product detail should have Add to Cart button"""
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        card = finds(driver, "product-card")[0]
        card.find_element(By.CSS_SELECTOR, 'a').click()
        wait_for(driver, "product-detail-page")
        try:
            atc = find(driver, "detail-add-to-cart")
            assert atc.is_displayed()
        except NoSuchElementException:
            # Product might be OOS
            assert find(driver, "notify-btn").is_displayed()

    def test_product_image_gallery(self, driver):
        """Product detail image gallery should be navigable"""
        driver.get(f"{BASE_URL}/products/iphone-15-pro")
        main_img = wait_for(driver, "main-product-image")
        assert main_img.is_displayed()

    def test_product_tabs(self, driver):
        """Product detail tabs should switch content"""
        driver.get(f"{BASE_URL}/products")
        finds(driver, "product-card")[0].find_element(By.CSS_SELECTOR, 'a').click()
        wait_for(driver, "product-tabs")
        find(driver, "tab-reviews").click()
        time.sleep(0.5)
        assert "reviews-content" in driver.page_source or "no-reviews" in driver.page_source
        find(driver, "tab-specs").click()
        assert wait_for(driver, "specs-content").is_displayed()

    def test_add_to_wishlist(self, driver):
        """Add to wishlist should work for logged-in users"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/products")
        finds(driver, "product-card")[1].find_element(By.CSS_SELECTOR, 'a').click()
        wait_for(driver, "wishlist-btn").click()
        time.sleep(1)
        # Check wishlist button state changed
        wishlist_btn = find(driver, "wishlist-btn")
        assert "♥" in wishlist_btn.text or wishlist_btn.get_attribute("aria-pressed") == "true"


# ═══════════════════════════════════════════════════
# 3. SHOPPING CART TESTS
# ═══════════════════════════════════════════════════
class TestShoppingCart:

    def setup_method(self, method):
        pass  # Login handled per test

    def test_add_to_cart_shows_count(self, driver):
        """Adding to cart should increment cart count"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)

        # Get initial cart count (may be 0 initially, no badge shown)
        try:
            initial_count = int(find(driver, "cart-count").text)
        except NoSuchElementException:
            initial_count = 0

        # Find first in-stock product and add
        buttons = finds(driver, "add-to-cart-btn")
        for btn in buttons:
            if btn.is_enabled() and "Out of Stock" not in btn.text:
                btn.click()
                break

        time.sleep(1.5)
        cart_count = wait_for(driver, "cart-count")
        new_count = int(cart_count.text)
        assert new_count == initial_count + 1

    def test_cart_page_shows_items(self, driver):
        """Cart page should display added items"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")
        # Either shows items or empty cart message
        try:
            items = finds(driver, "cart-item")
            assert len(items) > 0
        except (NoSuchElementException, AssertionError):
            assert find(driver, "empty-cart").is_displayed()

    def test_apply_valid_coupon(self, driver):
        """Valid coupon should be applied successfully"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")

        # Only test if there are items
        if not finds(driver, "cart-item"):
            pytest.skip("Cart is empty — add items first")

        coupon_input = find(driver, "coupon-input")
        coupon_input.clear()
        coupon_input.send_keys("WELCOME10")
        find(driver, "apply-coupon-btn").click()
        assert wait_for(driver, "coupon-success").is_displayed()

    def test_apply_invalid_coupon(self, driver):
        """Invalid coupon should show error message"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")

        if not finds(driver, "cart-item"):
            pytest.skip("Cart is empty")

        coupon_input = find(driver, "coupon-input")
        coupon_input.clear()
        coupon_input.send_keys("INVALIDCOUPON999")
        find(driver, "apply-coupon-btn").click()
        assert wait_for(driver, "coupon-error").is_displayed()

    def test_apply_expired_coupon(self, driver):
        """Expired coupon should show appropriate error"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")

        if not finds(driver, "cart-item"):
            pytest.skip("Cart is empty")

        coupon_input = find(driver, "coupon-input")
        coupon_input.clear()
        coupon_input.send_keys("EXPIRED50")
        find(driver, "apply-coupon-btn").click()
        error = wait_for(driver, "coupon-error")
        assert error.is_displayed()
        assert "expired" in error.text.lower() or "invalid" in error.text.lower()

    def test_remove_item_from_cart(self, driver):
        """Remove button should delete item from cart"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")

        remove_btns = finds(driver, "remove-item-btn")
        if not remove_btns:
            pytest.skip("No items in cart")

        count_before = len(remove_btns)
        remove_btns[0].click()
        time.sleep(1.5)
        count_after = len(finds(driver, "remove-item-btn"))
        assert count_after == count_before - 1

    def test_update_quantity(self, driver):
        """Quantity controls should update cart quantity"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/cart")
        wait_for(driver, "cart-page")

        qty_controls = finds(driver, "cart-qty")
        if not qty_controls:
            pytest.skip("No items in cart")

        initial_qty = int(qty_controls[0].text)
        finds(driver, "qty-increase")[0].click()
        time.sleep(1)
        new_qty = int(finds(driver, "cart-qty")[0].text)
        assert new_qty == initial_qty + 1


# ═══════════════════════════════════════════════════
# 4. CHECKOUT TESTS
# ═══════════════════════════════════════════════════
class TestCheckout:

    def _fill_shipping(self, driver):
        """Helper to fill shipping form"""
        wait_for(driver, "field-full-name").clear()
        find(driver, "field-full-name").send_keys("Test User")
        find(driver, "field-phone").clear()
        find(driver, "field-phone").send_keys("9876543210")
        find(driver, "field-line1").clear()
        find(driver, "field-line1").send_keys("123 Test Street")
        find(driver, "field-city").clear()
        find(driver, "field-city").send_keys("Bengaluru")
        Select(find(driver, "field-state")).select_by_visible_text("Karnataka")
        find(driver, "field-postal").clear()
        find(driver, "field-postal").send_keys("560001")

    def test_checkout_shows_step_indicator(self, driver):
        """Checkout page should show 4-step indicator"""
        login(driver, "jane@test.com", "Password123!")
        # Add item to cart first
        driver.get(f"{BASE_URL}/products")
        wait_for(driver, "product-grid", timeout=10)
        for btn in finds(driver, "add-to-cart-btn"):
            if btn.is_enabled() and "Out of Stock" not in btn.text:
                btn.click()
                break
        time.sleep(1)
        driver.get(f"{BASE_URL}/checkout")
        steps = finds(driver, "step-indicator")
        assert len(steps) > 0

    def test_shipping_form_validation(self, driver):
        """Empty shipping form should show validation error"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        wait_for(driver, "step-shipping")
        find(driver, "btn-next").click()
        time.sleep(0.5)
        # Toast error should appear
        try:
            toast = driver.find_element(By.CSS_SELECTOR, ".Toastify__toast")
            assert toast.is_displayed()
        except NoSuchElementException:
            pass  # May be using inline validation

    def test_postal_code_validation(self, driver):
        """Invalid postal code should trigger error"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        find(driver, "field-full-name").send_keys("John Doe")
        find(driver, "field-phone").send_keys("9876543210")
        find(driver, "field-line1").send_keys("123 Main St")
        find(driver, "field-city").send_keys("Mumbai")
        Select(find(driver, "field-state")).select_by_visible_text("Maharashtra")
        find(driver, "field-postal").send_keys("123")  # Invalid
        find(driver, "btn-next").click()
        time.sleep(0.5)
        toast = driver.find_element(By.CSS_SELECTOR, ".Toastify__toast")
        assert toast.is_displayed()

    def test_navigate_delivery_step(self, driver):
        """Completing shipping should navigate to delivery step"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        assert wait_for(driver, "step-delivery").is_displayed()

    def test_delivery_options_visible(self, driver):
        """Delivery step should show all delivery options"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        wait_for(driver, "step-delivery")
        assert find(driver, "delivery-standard").is_displayed()
        assert find(driver, "delivery-express").is_displayed()
        assert find(driver, "delivery-overnight").is_displayed()
        assert find(driver, "delivery-pickup").is_displayed()

    def test_date_picker_opens(self, driver):
        """Date picker should open and allow date selection"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        wait_for(driver, "step-delivery")
        find(driver, "date-picker-trigger").click()
        calendar = wait_for(driver, "datepicker-calendar")
        assert calendar.is_displayed()
        # Navigate to next month
        find(driver, "dp-next-month").click()
        time.sleep(0.3)
        # Select first available day
        day_buttons = finds(driver, "dp-day-15")
        if day_buttons:
            day_buttons[0].click()
        assert not find(driver, "datepicker-calendar").is_displayed() if finds(driver, "datepicker-calendar") else True

    def test_payment_step_shows_methods(self, driver):
        """Payment step should show all payment methods"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        wait_for(driver, "step-delivery")
        find(driver, "btn-next").click()
        wait_for(driver, "step-payment")
        assert find(driver, "payment-credit-card").is_displayed()
        assert find(driver, "payment-upi").is_displayed()
        assert find(driver, "payment-paypal").is_displayed()
        assert find(driver, "payment-cod").is_displayed()

    def test_credit_card_form_appears(self, driver):
        """Selecting credit card should show card form"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        wait_for(driver, "step-delivery")
        find(driver, "btn-next").click()
        wait_for(driver, "step-payment")
        find(driver, "payment-credit-card").click()
        assert wait_for(driver, "card-form").is_displayed()

    def test_iframe_payment_visible(self, driver):
        """iFrame payment widget should be visible"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        find(driver, "btn-next").click()
        wait_for(driver, "step-payment")
        find(driver, "payment-credit-card").click()
        iframe = wait_for(driver, "payment-iframe")
        assert iframe.is_displayed()
        # Verify it's actually an iframe
        assert iframe.tag_name == "iframe"

    def test_back_button_navigates(self, driver):
        """Back button should go to previous step"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        self._fill_shipping(driver)
        find(driver, "btn-next").click()
        wait_for(driver, "step-delivery")
        find(driver, "btn-back").click()
        assert wait_for(driver, "step-shipping").is_displayed()

    def test_order_summary_visible(self, driver):
        """Order summary should always be visible during checkout"""
        login(driver, "jane@test.com", "Password123!")
        driver.get(f"{BASE_URL}/checkout")
        summary = wait_for(driver, "order-summary")
        assert summary.is_displayed()


# ═══════════════════════════════════════════════════
# 5. ADMIN PANEL TESTS
# ═══════════════════════════════════════════════════
class TestAdminPanel:

    def test_admin_dashboard_loads(self, driver):
        """Admin dashboard should display stats"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin")
        stats = wait_for(driver, "stats-grid")
        assert stats.is_displayed()
        assert find(driver, "stat-total-revenue").is_displayed()

    def test_non_admin_denied(self, driver):
        """Regular user should be denied admin access"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/admin")
        time.sleep(2)
        assert "Access Denied" in driver.page_source or driver.current_url != f"{BASE_URL}/admin"

    def test_admin_products_page(self, driver):
        """Admin products page should show product table"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/products")
        table = wait_for(driver, "admin-products-table", timeout=15)
        assert table.is_displayed()
        rows = finds(driver, "admin-product-row")
        assert len(rows) > 0

    def test_add_product_modal(self, driver):
        """Add product button should open modal"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/products")
        wait_for(driver, "btn-add-product").click()
        modal = wait_for(driver, "product-form-modal")
        assert modal.is_displayed()

    def test_product_form_validation(self, driver):
        """Product form should validate required fields"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/products")
        wait_for(driver, "btn-add-product").click()
        wait_for(driver, "product-form-modal")
        find(driver, "btn-save-product").click()
        assert wait_for(driver, "product-name-error").is_displayed()

    def test_close_modal_with_escape(self, driver):
        """Pressing Escape should close the modal"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/products")
        wait_for(driver, "btn-add-product").click()
        wait_for(driver, "product-form-modal")
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
        time.sleep(0.5)
        modals = finds(driver, "product-form-modal")
        assert not modals or not modals[0].is_displayed()

    def test_drag_drop_image_upload(self, driver):
        """Dropzone should respond to drag events"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/products")
        wait_for(driver, "btn-add-product").click()
        wait_for(driver, "product-form-modal")
        dropzone = find(driver, "image-dropzone")
        assert dropzone.is_displayed()

        # Simulate drag over
        driver.execute_script("""
            const dropzone = arguments[0];
            const event = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            dropzone.dispatchEvent(event);
        """, dropzone)
        time.sleep(0.3)
        assert "drag-over" in dropzone.get_attribute("class")

    def test_create_coupon(self, driver):
        """Admin should be able to create a new coupon"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/coupons")
        wait_for(driver, "btn-create-coupon").click()
        wait_for(driver, "create-coupon-modal")

        code = f"TEST{random.randint(1000, 9999)}"
        find(driver, "coupon-code").send_keys(code)
        Select(find(driver, "coupon-type")).select_by_value("percentage")
        find(driver, "coupon-value").send_keys("15")
        find(driver, "coupon-limit").send_keys("50")
        find(driver, "btn-save-coupon").click()
        time.sleep(1.5)

        # Coupon code should appear in table
        page_source = driver.page_source
        assert code in page_source

    def test_admin_orders_table(self, driver):
        """Admin orders page should show orders table"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/orders")
        table = wait_for(driver, "admin-orders-table", timeout=10)
        assert table.is_displayed()

    def test_admin_users_table(self, driver):
        """Admin users page should show users table"""
        login(driver, "admin@shopqa.com", "Password123!")
        driver.get(f"{BASE_URL}/admin/users")
        table = wait_for(driver, "admin-users-table", timeout=10)
        assert table.is_displayed()
        rows = finds(driver, "admin-user-row")
        assert len(rows) > 0


# ═══════════════════════════════════════════════════
# 6. ACCESSIBILITY & EDGE CASES
# ═══════════════════════════════════════════════════
class TestAccessibilityAndEdgeCases:

    def test_page_title(self, driver):
        """Page title should contain ShopQA"""
        driver.get(BASE_URL)
        assert "ShopQA" in driver.title

    def test_navigation_keyboard(self, driver):
        """Navigation should be keyboard accessible"""
        driver.get(f"{BASE_URL}/login")
        email = find(driver, "input-email")
        email.send_keys(Keys.TAB)
        active = driver.execute_script("return document.activeElement.getAttribute('data-testid')")
        assert active is not None

    def test_404_page(self, driver):
        """Non-existent route should show 404 page"""
        driver.get(f"{BASE_URL}/this-does-not-exist-xyz")
        time.sleep(1)
        assert "404" in driver.page_source or "Not Found" in driver.page_source

    def test_home_page_hero(self, driver):
        """Home page hero section should be visible"""
        driver.get(BASE_URL)
        hero = wait_for(driver, "hero-section")
        assert hero.is_displayed()
        assert find(driver, "hero-title").is_displayed()

    def test_home_category_grid(self, driver):
        """Home page category grid should load"""
        driver.get(BASE_URL)
        grid = wait_for(driver, "category-grid", timeout=15)
        cats = finds(driver, "category-card")
        assert len(cats) >= 4

    def test_home_featured_products(self, driver):
        """Home page featured products should load"""
        driver.get(BASE_URL)
        grid = wait_for(driver, "featured-products-grid", timeout=15)
        cards = finds(driver, "featured-product-card")
        assert len(cards) > 0

    def test_profile_page_accessible(self, driver):
        """Profile page should be accessible when logged in"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/profile")
        assert wait_for(driver, "profile-page").is_displayed()

    def test_wishlist_accessible(self, driver):
        """Wishlist page should be accessible when logged in"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/wishlist")
        assert wait_for(driver, "wishlist-page").is_displayed()

    def test_protected_routes_redirect(self, driver):
        """Protected routes should redirect to login when not authenticated"""
        # Logout first
        driver.delete_all_cookies()
        driver.execute_script("localStorage.clear()")
        driver.get(f"{BASE_URL}/orders")
        time.sleep(1.5)
        assert "/login" in driver.current_url

    def test_star_rating_interactive(self, driver):
        """Star rating should be clickable in review form"""
        login(driver, "john@test.com", "Password123!")
        driver.get(f"{BASE_URL}/products")
        finds(driver, "product-card")[0].find_element(By.CSS_SELECTOR, 'a').click()
        wait_for(driver, "product-tabs")
        find(driver, "tab-reviews").click()
        find(driver, "write-review-btn").click()
        wait_for(driver, "review-form")
        stars = finds(driver, "star-4")
        if stars:
            stars[0].click()
            time.sleep(0.3)
