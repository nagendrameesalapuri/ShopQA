// Real Shadow DOM custom element (not a React portal or CSS-modules trick) —
// the ShopQA README lists Shadow DOM as a known automation gap. Styles and
// markup here are fully encapsulated, so testers must pierce the shadow root
// to interact with it, e.g. Playwright's `page.locator('shopqa-trust-badge')
// .locator('css=.verify-btn')` (Playwright pierces open shadow roots by
// default) or `>> css=` chained selectors for nested shadow trees.
class ShopqaTrustBadge extends HTMLElement {
  connectedCallback() {
    // attachShadow() throws if a shadow root already exists on this host —
    // reuse it across re-renders instead of calling it every time.
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.render();
  }

  render() {
    const shadow = this.shadowRoot;
    const verified = this.getAttribute("verified") === "true";

    shadow.innerHTML = `
      <style>
        :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .badge { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px;
                 background: #f0fdf4; border: 1px solid #86efac; }
        .badge.unverified { background: #fff7ed; border-color: #fed7aa; }
        .icon { font-size: 1.3rem; }
        .text { flex: 1; }
        .title { font-weight: 700; font-size: 0.85rem; color: #0f172a; margin: 0; }
        .sub { font-size: 0.75rem; color: #475569; margin: 2px 0 0; }
        button { border: none; background: #16a34a; color: #fff; font-weight: 700; font-size: 0.75rem;
                 padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        button.unverified-btn { background: #f97316; }
      </style>
      <div class="badge ${verified ? "" : "unverified"}" part="badge">
        <span class="icon">${verified ? "🔒" : "🛡️"}</span>
        <div class="text">
          <p class="title" id="badge-title">${verified ? "Verified Secure Checkout" : "SSL Secured Payment"}</p>
          <p class="sub">256-bit encryption · PCI DSS compliant</p>
        </div>
        <button class="${verified ? "" : "unverified-btn"}" id="verify-btn" type="button">
          ${verified ? "✓ Verified" : "Verify"}
        </button>
      </div>
    `;

    shadow.getElementById("verify-btn").addEventListener("click", () => {
      this.setAttribute("verified", "true");
      this.render();
      this.dispatchEvent(new CustomEvent("verified", { bubbles: true, composed: true }));
    });
  }
}

if (!customElements.get("shopqa-trust-badge")) {
  customElements.define("shopqa-trust-badge", ShopqaTrustBadge);
}

export default ShopqaTrustBadge;
