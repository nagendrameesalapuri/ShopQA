const API_ORIGIN = "https://shopqa-backend.onrender.com";

const stableImageLock = (value) => {
  let hash = 0;
  for (const character of String(value || "product")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return (hash % 100000) + 1;
};

/**
 * Return a usable image for every catalog product.
 * Uploaded images keep using the API; products without one use a stable,
 * internet-sourced image matched to the product's brand and name.
 */
export const productImageUrl = (image, product = {}, size = 800) => {
  if (image) {
    return /^https?:\/\//i.test(image) ? image : `${API_ORIGIN}${image}`;
  }

  const keywords = [product.brand, product.name]
    .filter(Boolean)
    .join(",")
    .toLowerCase()
    .replace(/[^a-z0-9,]+/g, ",")
    .replace(/,+/g, ",")
    .replace(/^,|,$/g, "");

  return `https://loremflickr.com/${size}/${size}/${encodeURIComponent(keywords || "product")}?lock=${stableImageLock(product.slug || product.id || product.name)}`;
};
