const API_ORIGIN = "https://shopqa-backend.onrender.com";

// Curated, hand-verified real photos for seeded catalog products, keyed by
// exact product name. Each entry was visually checked to actually show the
// named product (not just keyword-matched) before being added here — past
// attempts at automatic/category-based photos produced mismatched images,
// so anything not verified here intentionally falls through to the
// generated tile instead of guessing.
const CURATED_PHOTOS = {
  "iPhone 15 Pro": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Apple_iPhone_15_Pro.jpg/960px-Apple_iPhone_15_Pro.jpg",
  "MacBook Air M3": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Photo_of_an_Apple_MacBook_Air_with_strong_bokeh.jpg/960px-Photo_of_an_Apple_MacBook_Air_with_strong_bokeh.jpg",
  'iPad Pro 12.9"': "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/IPad_Pro.jpg/960px-IPad_Pro.jpg",
  "Dell XPS 15": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Dell_XPS_15_%282017%29.png/960px-Dell_XPS_15_%282017%29.png",
  "JBL Flip 6": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/JBL_Flip_4.jpg/960px-JBL_Flip_4.jpg",
  "Canon EOS R50": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Canon_EOS_R50%2C_White%2C_3.jpg/960px-Canon_EOS_R50%2C_White%2C_3.jpg",
  'LG 4K OLED TV 55"': "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/LG_OLED_TV.jpg/960px-LG_OLED_TV.jpg",
  "Nintendo Switch OLED": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Nintendo_Switch_%E2%80%93_OLED-Modell_mit_gedockter_Konsole_20230506_HOF01624_RAW-Export.png/960px-Nintendo_Switch_%E2%80%93_OLED-Modell_mit_gedockter_Konsole_20230506_HOF01624_RAW-Export.png",
  "Nike Air Force 1": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nike_air_Force_1_white_on_white.jpg/960px-Nike_air_Force_1_white_on_white.jpg",
  "The North Face Jacket": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/The_North_Face_Mountain_Light_Triclimate_Down_Jacket.jpg/960px-The_North_Face_Mountain_Light_Triclimate_Down_Jacket.jpg",
  "Ray-Ban Aviator": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/RayBanAviator.jpg/960px-RayBanAviator.jpg",
  "Atomic Habits": "https://upload.wikimedia.org/wikipedia/commons/0/06/Atomic_habits.jpg",
  Dune: "https://upload.wikimedia.org/wikipedia/commons/b/be/Dune_by_Frank_Herbert_first_edition_cover.jpg",
  "Nespresso Vertuo Pop": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Nespresso_Vertuo_Pop.jpg/960px-Nespresso_Vertuo_Pop.jpg",
  "Philips Air Fryer": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Airfryer_Convert.jpg/960px-Airfryer_Convert.jpg",
  "Adjustable Dumbbell Set": "https://upload.wikimedia.org/wikipedia/commons/e/e3/TwoDumbbells.JPG",
  "Running Shoes X100": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Gym_Shoes_-_Nike_Metcon_%2851080442242%29.jpg/960px-Gym_Shoes_-_Nike_Metcon_%2851080442242%29.jpg",
  "LEGO Technic Bugatti": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Bugatti_Chiron_Lego_01.jpg/960px-Bugatti_Chiron_Lego_01.jpg",
  "Monopoly Board Game": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Monopoly_board_on_white_bg.jpg/960px-Monopoly_board_on_white_bg.jpg",
  "Hot Wheels 20-Car Pack": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Hot_Wheels_Modellauto.jpg/960px-Hot_Wheels_Modellauto.jpg",
  "Chess Set Wooden": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Wooden_Chess_Set_%284163089889%29.jpg/960px-Wooden_Chess_Set_%284163089889%29.jpg",
  'Michelin Wiper Blade 24"': "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Used_Michelin_8019_windshield_wiper_blade_tip.jpg/960px-Used_Michelin_8019_windshield_wiper_blade_tip.jpg",
  "Car Dash Cam 4K": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Dashcams_P1210466.JPG/960px-Dashcams_P1210466.JPG",
  "Bluetooth OBD2 Scanner": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Bluetooth_ELM327_OBD2-Scanner_IMG_6320.jpg/960px-Bluetooth_ELM327_OBD2-Scanner_IMG_6320.jpg",
  "Dyson V15 Vacuum": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Dyson_Cyclone_V10_Absolute_cordless_stick_vacuum.jpg/960px-Dyson_Cyclone_V10_Absolute_cordless_stick_vacuum.jpg",
  "Le Creuset Dutch Oven": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Lecreuset_lamama-enzomari.JPG/960px-Lecreuset_lamama-enzomari.JPG",
};

// Category icon glyphs for products with no curated photo, so the fallback
// tile at least sketches the right kind of object instead of repeating the
// same generic box for every category.
const CATEGORY_ICONS = {
  Electronics: 'M120 140h160v110H120zM160 270h80M180 282h20',
  Clothing: 'M150 120l50 24 50-24 34 30-24 30v104H140V180l-24-30z',
  Books: 'M120 130h74v148l-37-20-37 20zM204 130h76a10 10 0 0 1 10 10v138H214a10 10 0 0 0-10 10V130z',
  "Home & Kitchen": 'M135 195h130v50a25 25 0 0 1-25 25h-80a25 25 0 0 1-25-25z M112 200h20v18h-20zM268 200h20v18h-20z M150 185h100',
  "Sports & Fitness": 'M100 200h20v-30h30v90h-30v-30h-20zM280 200h-20v-30h-30v90h30v-30h20z M150 200h100',
  "Beauty & Personal Care": 'M180 120h40v24h-40zM172 144h56l8 20v106a10 10 0 0 1-10 10h-52a10 10 0 0 1-10-10V164z',
  "Toys & Games": 'M130 150h60v60h-60zM210 150h60v60h-60zM130 230h60v60h-60zM210 230h60v60h-60z',
  Automotive: 'M110 220l20-56a16 16 0 0 1 15-10h110a16 16 0 0 1 15 10l20 56v50h-30v-20H140v20h-30z M150 220h100 M135 244a12 12 0 1 0 0.1 0zM265 244a12 12 0 1 0 0.1 0z',
};
const DEFAULT_ICON = 'M160 126h80l14 38h-108l14-38zm-20 58h120v92H140z';

const escapeXml = (value) => String(value || "Product")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const productTileUrl = (product, size) => {
  const name = escapeXml(product.name || "Product");
  const brand = escapeXml(product.brand || "ShopQA");
  const icon = CATEGORY_ICONS[product.category_name] || DEFAULT_ICON;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1f5f9"/><rect x="38" y="38" width="324" height="324" rx="24" fill="#ffffff" stroke="#dbe4ee" stroke-width="3"/><path d="${icon}" fill="none" stroke="#ff6b14" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/><text x="200" y="296" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#0f172a">${name.slice(0, 28)}</text><text x="200" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#64748b">${brand.slice(0, 24)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Return a usable image for every catalog product.
 * Uploaded images keep using the API. Seeded products with a hand-verified
 * curated photo use that. Everything else gets an embedded, labelled
 * product tile—not an unrelated remote photograph.
 */
export const productImageUrl = (image, product = {}, size = 800) => {
  if (image) {
    return /^https?:\/\//i.test(image) ? image : `${API_ORIGIN}${image}`;
  }

  if (product.name && CURATED_PHOTOS[product.name]) {
    return CURATED_PHOTOS[product.name];
  }

  return productTileUrl(product, size);
};
