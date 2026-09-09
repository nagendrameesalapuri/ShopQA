const API_ORIGIN = "https://shopqa-backend.onrender.com";

const stableImageLock = (value) => {
  let hash = 0;
  for (const character of String(value || "product")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return (hash % 100000) + 1;
};

const productImageTag = (product) => {
  const name = `${product.name || ""} ${product.category || ""}`.toLowerCase();
  const rules = [
    [/iphone|galaxy/, "smartphone"], [/macbook|dell xps/, "laptop"],
    [/sony wh/, "headphones"], [/ipad/, "tablet"], [/jbl/, "speaker"],
    [/canon/, "camera"], [/oled tv/, "television"], [/nintendo/, "game-console"],
    [/jeans/, "jeans"], [/air force|ultraboost|running shoes/, "sneakers"],
    [/jacket/, "jacket"], [/dress/, "dress"], [/t-shirt/, "tshirt"], [/aviator/, "sunglasses"],
    [/atomic habits|psychology of money|clean code|system design|pragmatic programmer|dune/, "books"],
    [/instant pot/, "pressure-cooker"], [/vacuum/, "vacuum-cleaner"], [/nespresso/, "coffee-machine"],
    [/dutch oven/, "dutch-oven"], [/air fryer/, "air-fryer"], [/kallax/, "shelving"],
    [/fitbit/, "fitness-tracker"], [/yoga mat/, "yoga-mat"], [/whey protein/, "protein-powder"],
    [/dumbbell/, "dumbbells"], [/resistance bands/, "resistance-bands"],
    [/serum|niacinamide/, "skincare"], [/lipstick/, "lipstick"], [/airwrap/, "hair-styler"],
    [/sunscreen/, "sunscreen"], [/lego/, "lego"], [/monopoly/, "board-game"],
    [/barbie/, "doll"], [/hot wheels/, "toy-car"], [/chess/, "chess"],
    [/wiper/, "windshield-wiper"], [/dash cam/, "dashcam"], [/inflator/, "tire-inflator"],
    [/seat organizer/, "car-organizer"], [/obd/, "obd-scanner"],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || "product";
};

/**
 * Return a usable image for every catalog product.
 * Uploaded images keep using the API; products without one use a stable,
 * internet-sourced image matched to the product's specific type.
 */
export const productImageUrl = (image, product = {}, size = 800) => {
  if (image) {
    return /^https?:\/\//i.test(image) ? image : `${API_ORIGIN}${image}`;
  }

  const tag = productImageTag(product);
  return `https://loremflickr.com/${size}/${size}/${tag}?random=${stableImageLock(product.slug || product.id || product.name)}`;
};
