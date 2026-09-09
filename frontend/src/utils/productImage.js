const API_ORIGIN = "https://shopqa-backend.onrender.com";

const escapeXml = (value) => String(value || "Product")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const productTileUrl = (product, size) => {
  const name = escapeXml(product.name || "Product");
  const brand = escapeXml(product.brand || "ShopQA");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1f5f9"/><rect x="38" y="38" width="324" height="324" rx="24" fill="#ffffff" stroke="#dbe4ee" stroke-width="3"/><path d="M160 126h80l14 38h-108l14-38zm-20 58h120v92H140z" fill="#ff6b14" opacity=".16"/><path d="M172 126h56l10 30h-76l10-30zm-18 58h92v70h-92z" fill="#ff6b14" opacity=".8"/><text x="200" y="296" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#0f172a">${name.slice(0, 28)}</text><text x="200" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#64748b">${brand.slice(0, 24)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Return a usable image for every catalog product.
 * Uploaded images keep using the API. Products without a verified asset get
 * an embedded, labelled product tile—not an unrelated remote photograph.
 */
export const productImageUrl = (image, product = {}, size = 800) => {
  if (image) {
    return /^https?:\/\//i.test(image) ? image : `${API_ORIGIN}${image}`;
  }

  return productTileUrl(product, size);
};
