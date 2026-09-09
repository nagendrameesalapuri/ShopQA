const API_ORIGIN = "https://shopqa-backend.onrender.com";

// Direct images selected for the exact model. Do not replace these with an
// image-search URL: search services can return unrelated photos.
const PRODUCT_IMAGES = {
  "iphone 15 pro": "https://alephksa.com/cdn/shop/files/iPhone_15_Pro_Natural_Titanium_PDP_Image_Position-1__en-ME.jpg?v=1694758467&width=1445",
  "samsung galaxy s24 ultra": "https://www.techbros.ae/cdn/shop/files/ae-galaxy-s24-s928-sm-s928bztcmea-539263955.png?v=1763218640&width=1214",
  "macbook air m3": "https://www.custommacbd.com/cdn/shop/files/mba13-m3-spacegray-Custom-Mac-BD.png?v=1711705803",
  "sony wh-1000xm5": "https://www.sony.ch/image/86ef18640c4199cc7ce7150a5143460a?fmt=png-alpha&wid=660",
};

/**
 * Return a usable image for every catalog product.
 * Uploaded images keep using the API. Curated external product images are
 * used only when their model matches exactly; unknown items get a labelled
 * tile rather than an unrelated photograph.
 */
export const productImageUrl = (image, product = {}, size = 800) => {
  if (image) {
    return /^https?:\/\//i.test(image) ? image : `${API_ORIGIN}${image}`;
  }

  const exactImage = PRODUCT_IMAGES[String(product.name || "").toLowerCase()];
  if (exactImage) return exactImage;

  const label = encodeURIComponent(product.name || "Product image");
  return `https://placehold.co/${size}x${size}/f1f5f9/0f172a?text=${label}`;
};
