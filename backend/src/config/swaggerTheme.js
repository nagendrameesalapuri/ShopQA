// Custom Swagger UI theme matching the ShopQA storefront brand palette
// (navy #0f172a + orange #f97316), so /api-docs looks like part of the
// same product instead of the stock dark/monochrome Swagger UI default.
//
// Every rule is !important: swagger-ui-dist ships its own
// prefers-color-scheme:dark overrides, and on a browser/OS in dark mode
// those otherwise win against unqualified custom CSS, leaving dark text
// on a dark background (illegible). Forcing light mode here regardless
// of the viewer's OS theme keeps the ShopQA-branded look consistent.
module.exports = `
  :root { color-scheme: light !important; }

  html, body {
    background: #f8fafc !important;
  }

  .swagger-ui,
  .swagger-ui .wrapper,
  .swagger-ui section.models,
  .swagger-ui .opblock-body,
  .swagger-ui .opblock-section,
  .swagger-ui .responses-wrapper,
  .swagger-ui .parameters-container,
  .swagger-ui .tab {
    background: #f8fafc !important;
    color: #1e293b !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }

  /* ── Top bar with ShopQA wordmark ─────────────────────────────────── */
  .swagger-ui .topbar {
    display: flex !important;
    align-items: center !important;
    background: #0f172a !important;
    background-image: linear-gradient(90deg, #0f172a 0%, #1e293b 100%) !important;
    padding: 14px 24px !important;
    border-bottom: 4px solid #f97316 !important;
  }
  .swagger-ui .topbar .topbar-wrapper { display: none !important; }
  .swagger-ui .topbar::before {
    content: "🛍  ShopQA API";
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff !important;
    letter-spacing: 0.02em;
  }
  .swagger-ui .topbar::after {
    content: "QA Automation Practice Platform";
    margin-left: 16px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fdba74 !important;
  }

  /* ── Info / description section ──────────────────────────────────── */
  .swagger-ui .info { margin: 32px 0 !important; }
  .swagger-ui .info .title {
    color: #0f172a !important;
    font-weight: 800 !important;
  }
  .swagger-ui .info .title small.version-stamp,
  .swagger-ui .info .title small {
    background: #f97316 !important;
  }
  .swagger-ui .info a.link,
  .swagger-ui .info a { color: #ea580c !important; font-weight: 600 !important; }
  .swagger-ui .info a:hover { color: #c2410c !important; }
  .swagger-ui .info li,
  .swagger-ui .info p,
  .swagger-ui .info span,
  .swagger-ui .renderedMarkdown p,
  .swagger-ui .renderedMarkdown li {
    color: #334155 !important;
  }
  .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3 {
    color: #0f172a !important;
    border-bottom: 2px solid #fed7aa !important;
    padding-bottom: 6px;
  }
  .swagger-ui .info code,
  .swagger-ui .renderedMarkdown code {
    background: #fff7ed !important;
    color: #c2410c !important;
    border: 1px solid #fed7aa !important;
    border-radius: 4px;
    padding: 2px 6px;
  }

  /* ── Side-by-side Test Credentials / Test Cards columns ─────────────
     DOMPurify strips class attributes from the markdown-rendered HTML,
     so the wrapper <div>s in swagger.js's description survive but bare
     — target them structurally (direct-child position) instead. */
  .swagger-ui .info .renderedMarkdown > div,
  .swagger-ui .info .markdown > div {
    display: flex !important;
    flex-wrap: wrap;
    gap: 20px;
    margin: 12px 0 20px;
  }
  .swagger-ui .info .renderedMarkdown > div > div,
  .swagger-ui .info .markdown > div > div {
    flex: 1 1 300px;
    min-width: 260px;
  }
  .swagger-ui .info .renderedMarkdown > div > div h3,
  .swagger-ui .info .markdown > div > div h3 {
    font-size: 1.05rem !important;
    margin: 0 0 8px !important;
  }
  .swagger-ui .info .renderedMarkdown > div > div table,
  .swagger-ui .info .markdown > div > div table {
    font-size: 0.82rem !important;
    margin: 0 !important;
  }
  .swagger-ui .info .renderedMarkdown > div > div table th,
  .swagger-ui .info .renderedMarkdown > div > div table td,
  .swagger-ui .info .markdown > div > div table th,
  .swagger-ui .info .markdown > div > div table td {
    padding: 6px 10px !important;
  }

  /* ── Markdown tables (Test Credentials / Test Cards) ─────────────── */
  .swagger-ui .info table,
  .swagger-ui .renderedMarkdown table,
  .swagger-ui .markdown table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 12px 0 20px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff !important;
  }
  .swagger-ui .info table thead tr,
  .swagger-ui .renderedMarkdown table thead tr,
  .swagger-ui .markdown table thead tr {
    background: #0f172a !important;
  }
  .swagger-ui .info table thead th,
  .swagger-ui .renderedMarkdown table thead th,
  .swagger-ui .markdown table thead th {
    color: #ffffff !important;
    text-align: left;
    padding: 10px 14px;
    font-weight: 700;
  }
  .swagger-ui .info table tbody tr,
  .swagger-ui .renderedMarkdown table tbody tr,
  .swagger-ui .markdown table tbody tr {
    background: #ffffff !important;
  }
  .swagger-ui .info table tbody td,
  .swagger-ui .renderedMarkdown table tbody td,
  .swagger-ui .markdown table tbody td {
    padding: 9px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b !important;
    background: transparent !important;
  }
  .swagger-ui .info table tbody tr:nth-child(even),
  .swagger-ui .renderedMarkdown table tbody tr:nth-child(even),
  .swagger-ui .markdown table tbody tr:nth-child(even) {
    background: #fff7ed !important;
  }
  .swagger-ui .info table tbody tr:hover,
  .swagger-ui .renderedMarkdown table tbody tr:hover,
  .swagger-ui .markdown table tbody tr:hover {
    background: #fed7aa !important;
  }

  /* ── Server / scheme selector ─────────────────────────────────────── */
  .swagger-ui .scheme-container {
    background: #ffffff !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid #e2e8f0 !important;
    border-radius: 10px;
    padding: 16px;
  }
  .swagger-ui select {
    border: 2px solid #f97316 !important;
    border-radius: 6px;
    font-weight: 600;
    color: #0f172a !important;
    background: #ffffff !important;
  }

  /* ── Authorize button ─────────────────────────────────────────────── */
  .swagger-ui .btn.authorize {
    background: #f97316 !important;
    color: #ffffff !important;
    border-color: #ea580c !important;
    font-weight: 700;
    border-radius: 6px;
  }
  .swagger-ui .btn.authorize span { color: #ffffff !important; }
  .swagger-ui .btn.authorize:hover { background: #ea580c !important; }
  .swagger-ui .btn.authorize svg { fill: #ffffff !important; }

  /* ── Tag section headers (Products, Orders, Auth …) ──────────────── */
  .swagger-ui .opblock-tag {
    color: #0f172a !important;
    background: #f8fafc !important;
    font-size: 1.3rem;
    font-weight: 800;
    border-bottom: 2px solid #fed7aa !important;
  }
  .swagger-ui .opblock-tag:hover { background: #fff7ed !important; }
  .swagger-ui .opblock-tag small,
  .swagger-ui .opblock-tag span { color: #64748b !important; }

  /* ── Operation blocks, colored per HTTP method ───────────────────── */
  .swagger-ui .opblock {
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
    margin: 0 0 12px !important;
  }
  .swagger-ui .opblock .opblock-summary-method {
    border-radius: 6px;
    font-weight: 800;
    min-width: 80px;
    text-align: center;
    color: #ffffff !important;
  }
  .swagger-ui .opblock .opblock-summary {
    background: transparent !important;
  }

  .swagger-ui .opblock.opblock-get { background: #eff8ff !important; border-color: #0284c7 !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #0284c7 !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #0284c7 !important; }

  .swagger-ui .opblock.opblock-post { background: #f0fdf4 !important; border-color: #16a34a !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #16a34a !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #16a34a !important; }

  .swagger-ui .opblock.opblock-put { background: #fffbeb !important; border-color: #d97706 !important; }
  .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #d97706 !important; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #d97706 !important; }

  .swagger-ui .opblock.opblock-patch { background: #faf5ff !important; border-color: #9333ea !important; }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #9333ea !important; }
  .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #9333ea !important; }

  .swagger-ui .opblock.opblock-delete { background: #fef2f2 !important; border-color: #dc2626 !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #dc2626 !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #dc2626 !important; }

  .swagger-ui .opblock .opblock-summary-path,
  .swagger-ui .opblock .opblock-summary-path__deprecated,
  .swagger-ui .opblock .opblock-summary-operation-id {
    color: #0f172a !important;
    font-weight: 700;
  }
  .swagger-ui .opblock .opblock-summary-description { color: #475569 !important; }

  /* ── Buttons inside operations (Try it out / Execute) ────────────── */
  .swagger-ui .btn.try-out__btn {
    border: 2px solid #f97316 !important;
    color: #f97316 !important;
    background: #ffffff !important;
    font-weight: 700;
    border-radius: 6px;
  }
  .swagger-ui .btn.try-out__btn:hover { background: #fff7ed !important; }
  .swagger-ui .btn.execute {
    background: #f97316 !important;
    border-color: #ea580c !important;
    color: #ffffff !important;
    font-weight: 800;
    border-radius: 6px;
  }
  .swagger-ui .btn.execute:hover { background: #ea580c !important; }
  .swagger-ui .btn.cancel {
    border-color: #dc2626 !important;
    color: #dc2626 !important;
    background: #ffffff !important;
    border-radius: 6px;
  }

  /* ── Parameters / responses tables inside an operation ────────────── */
  .swagger-ui table thead tr th,
  .swagger-ui .opblock-description-wrapper p,
  .swagger-ui .opblock-external-docs-wrapper p,
  .swagger-ui .opblock-title_normal p {
    color: #0f172a !important;
  }
  .swagger-ui .parameters-col_description,
  .swagger-ui .response-col_description,
  .swagger-ui td.col_description,
  .swagger-ui .parameter__name,
  .swagger-ui .parameter__in,
  .swagger-ui .response-col_status {
    color: #1e293b !important;
  }
  .swagger-ui .parameter__name { font-weight: 700 !important; }
  .swagger-ui .parameter__type { color: #ea580c !important; }
  .swagger-ui table.parameters tbody tr,
  .swagger-ui .responses-table tbody tr {
    background: #ffffff !important;
  }

  /* ── Models / schemas section ─────────────────────────────────────── */
  .swagger-ui .model-title,
  .swagger-ui .model,
  .swagger-ui .model .property,
  .swagger-ui .model-toggle {
    color: #0f172a !important;
  }
  .swagger-ui section.models { border: 1px solid #e2e8f0 !important; border-radius: 10px; }
  .swagger-ui section.models h4 { color: #0f172a !important; }
  .swagger-ui .model-box { background: #f8fafc !important; border-radius: 6px; }

  /* ── Parameter / body code blocks (kept dark for contrast) ────────── */
  .swagger-ui .highlight-code,
  .swagger-ui .microlight,
  .swagger-ui .body-param__text {
    background: #0f172a !important;
    border-radius: 8px;
  }
  .swagger-ui .highlight-code *,
  .swagger-ui .microlight * {
    color: #e2e8f0 !important;
  }
`;
