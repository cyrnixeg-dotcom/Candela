import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    "name": "Lavender Body Mist",
    "slug": "lavender-body-mist",
    "description": "Soothing and serene lavender mist. Perfect for winding down or refreshing throughout the day.",
    "price": 150,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/lavender-body-mist.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Lavender Perfume Oil",
    "slug": "lavender-perfume-oil",
    "description": "Pure, calming lavender with a hint of vanilla and clean musk.",
    "price": 100,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/lavender-perfume-oil.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Baccarat Rouge Body Mist",
    "slug": "baccarat-rouge-body-mist",
    "description": "A luminous and sophisticated fragrance. Radiant, complex, and highly luxurious.",
    "price": 150,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/baccarat-rouge-body-mist.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Whipped Body Lotion",
    "slug": "whipped-body-lotion",
    "description": "Indulgent whipped body lotion in a luxury jar. Silky-smooth with a feminine fragrance trail.",
    "price": 200,
    "category": "body-beauty",
    "subcategory": "Body Lotion",
    "image": "/images/products/whipped-body-lotion.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Luxury Body Serum",
    "slug": "luxury-body-serum",
    "description": "\n\nAn intense illuminating body serum for a deeper, richer glow and profound hydration.",
    "price": 250,
    "category": "body-beauty",
    "subcategory": "Body Serum",
    "image": "/images/products/luxury-body-serum.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Illuminating Body Serum",
    "slug": "illuminating-body-serum",
    "description": "A luxurious illuminating body serum that nourishes deeply while leaving your skin with a radiant, golden glow.",
    "price": 250,
    "category": "body-beauty",
    "subcategory": "Body Serum",
    "image": "/images/products/illuminating-body-serum.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Car Diffuser",
    "slug": "car-diffuser",
    "description": "A premium car diffuser with an amber stone bead on a rich red cord. Fill your car with your favourite Candela scent.",
    "price": 150,
    "category": "home-car",
    "subcategory": "Car Diffuser",
    "image": "/images/products/car-diffuser.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Crazy Love Perfume Oil",
    "slug": "crazy-love-perfume-oil",
    "description": "A passionate floral oriental. Rose, patchouli, and vanilla entwined in a romantic embrace.",
    "price": 100,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/crazy-love-perfume-oil.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Dark Kiss Body Mist",
    "slug": "dark-kiss-body-mist",
    "description": "Seductive berry and black rose with a warm vanilla musk base. Deeply feminine.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/dark-kiss-body-mist.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Dark Kiss Perfume Oil",
    "slug": "dark-kiss-perfume-oil",
    "description": "Seductive berry and black rose with a warm vanilla musk base in a concentrated oil.",
    "price": 35,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/dark-kiss-perfume-oil.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Gingham Body Mist",
    "slug": "gingham-body-mist",
    "description": "Clean, fresh and cheerful. Bright citrus notes over a soft floral heart.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/gingham-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Glazed Donut Body Mist",
    "slug": "glazed-donut-body-mist",
    "description": "Sweet, warm, and irresistible. A delicious gourmand scent of fresh vanilla and sugar.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/glazed-donut-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "In The Stars Body Mist",
    "slug": "in-the-stars-body-mist",
    "description": "Celestial and soft. Starlit musk with delicate white floral and warm amber.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/in-the-stars-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Into The Night Body Mist",
    "slug": "into-the-night-body-mist",
    "description": "A timeless, feminine, alluring blend of dark berries, midnight jasmine and rich amber.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/into-the-night-body-mist.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Kayali Vanilla 28 Body Mist",
    "slug": "kayali-vanilla-body-mist",
    "description": "A rich, decadent vanilla masterpiece. Warm, sweet, and incredibly comforting.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/kayali-vanilla-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Khomra Body Mist",
    "slug": "khomra-body-mist",
    "description": "A deeply luxurious and enchanting oriental fragrance with warm spices and amber.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/khomra-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Massage Candle",
    "slug": "massage-candle",
    "description": "A luxurious dual-purpose candle that melts into a warm, nourishing massage oil. Romance meets self-care.",
    "price": 95,
    "category": "candles",
    "subcategory": "Massage Candle",
    "image": "/images/products/massage-candle.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Scandal Perfume Oil",
    "slug": "scandal-perfume-oil",
    "description": "Bold, seductive, unforgettable. A feminine oriental scent with honey, mandarin, and caramel.",
    "price": 35,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/scandal-perfume-oil.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Thousand Wishes Perfume Oil",
    "slug": "thousand-wishes-perfume-oil",
    "description": "Warm sparkling champagne, almond blossom, and sandalwood. A celebration in a bottle.",
    "price": 35,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/thousand-wishes-perfume-oil.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Yara Candy Body Mist",
    "slug": "yara-candy-body-mist",
    "description": "Playful, sweet, and wildly feminine. A sugary candy delight.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/yara-candy-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Van Gogh Candle Jar",
    "slug": "van-gogh-candle-jar",
    "description": "An artistic candle jar featuring a Van Gogh Starry Night inspired label.",
    "price": 250,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/vangogh-candle.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Gingham Candle",
    "slug": "gingham-candle",
    "description": "500 gram \nFresh and cheerful blue gingham candle to brighten any room. ",
    "price": 600,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/gingham-candle.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Black Air Freshener",
    "slug": "black-air-freshener",
    "description": "A sophisticated and bold air freshener for your car or home.",
    "price": 45,
    "category": "home-car",
    "subcategory": "Air Freshener",
    "image": "/images/products/black-air-freshener.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Blue Air Freshener",
    "slug": "blue-air-freshener",
    "description": "A crisp, clean, and refreshing blue air freshener.",
    "price": 45,
    "category": "home-car",
    "subcategory": "Air Freshener",
    "image": "/images/products/blue-air-freshener.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Yellow Air Freshener",
    "slug": "yellow-air-freshener",
    "description": "A bright, sunny, and uplifting citrus air freshener.",
    "price": 45,
    "category": "home-car",
    "subcategory": "Air Freshener",
    "image": "/images/products/yellow-air-freshener.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Bloom Girl Candle",
    "slug": "bloom-girl-candle",
    "description": "A beautifully crafted floral candle that brings a garden of blooming flowers into your space.",
    "price": 110,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/bloom-girl-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Classic Candle",
    "slug": "classic-candle-1",
    "description": "An elegant, classic Candela jar candle with a timeless scent.",
    "price": 95,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/classic-candle-1.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Coffee Latte Candle",
    "slug": "coffee-latte-candle",
    "description": "A deliciously scented candle that looks and smells like a fresh, warm coffee latte. A perfect dessert candle.",
    "price": 130,
    "category": "candles",
    "subcategory": "Candle Cakes",
    "image": "/images/products/coffee-latte-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Couples Romance Candle",
    "slug": "couples-candle",
    "description": "A deeply romantic candle designed to set the perfect mood for couples.",
    "price": 120,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/couples-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Peony Blossom Candle",
    "slug": "peony-blossom-candle",
    "description": "A delicate and luxurious peony-scented candle that fills the room with soft floral notes.",
    "price": 100,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/peony-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Pink Velvet Candle",
    "slug": "pink-candle",
    "description": "Our signature soft pink candle. Feminine, warm, and comforting.",
    "price": 105,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/pink-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Romeo Candle",
    "slug": "romeo-candle",
    "description": "A strong, captivating, and romantic fragrance encapsulated in an elegant jar.",
    "price": 120,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/romeo-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Romeo & Juliet Candle",
    "slug": "romeo-and-juliet-candle",
    "description": "The ultimate symbol of romance. A beautifully harmonious scent combining masculine and feminine notes.",
    "price": 140,
    "category": "candles",
    "subcategory": "Candle Jar",
    "image": "/images/products/romeo-and-juliet-candle.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Gingham Perfume Oil",
    "slug": "gingham-perfume-oil",
    "description": "A highly concentrated version of the fresh and cheerful Gingham scent. Bright citrus over soft florals.",
    "price": 100,
    "category": "body-beauty",
    "subcategory": "Perfume Oil",
    "image": "/images/products/gingham-perfume-oil.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Good Girl Gift Set",
    "slug": "good-girl-gift-set",
    "description": "The ultimate Good Girl experience. A stunning gift set featuring both the mist and oil.",
    "price": 145,
    "category": "body-beauty",
    "subcategory": "Gift Set",
    "image": "/images/products/good-girl-gift-set.png",
    "isFeatured": false,
    "inStock": false
  },
  {
    "name": "Loose Highlighter Powder",
    "slug": "loose-highlighter",
    "description": "A finely milled, ultra-reflective loose highlighter that gives your face and body a mesmerizing glow.",
    "price": 85,
    "category": "body-beauty",
    "subcategory": "Highlighter",
    "image": "/images/products/loose-highlighter.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Victoria Secret Inspired Mist",
    "slug": "victoria-secret-inspired-mist",
    "description": "A classic, iconic, and deeply alluring feminine body mist.",
    "price": 150,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/victorias-secret-inspired-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Angel Pink Body Mist",
    "slug": "angel-pink-body-mist",
    "description": "A soft, heavenly pink mist with angelic floral and sweet notes.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/angel-pink-body-mist.png",
    "isFeatured": true,
    "inStock": true
  },
  {
    "name": "Bunny Kiss Body Mist",
    "slug": "bunny-kiss-body-mist",
    "description": "A playful, sweet, and soft body mist that leaves a gentle lingering scent.",
    "price": 55,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/bunny-kiss-body-mist.png",
    "isFeatured": false,
    "inStock": true
  },
  {
    "name": "Thousand Wishes Body Mist",
    "slug": "thousand-wishes-body-mist",
    "description": "Sprays with a beautiful scent",
    "price": 150,
    "category": "body-beauty",
    "subcategory": "Body Mist",
    "image": "/images/products/thousand-wishes-body-mist.png",
    "isFeatured": false,
    "inStock": true
  }
];

const siteSettings = [
  {
    "key": "phone",
    "value": "+20 100 000 0000"
  },
  {
    "key": "whatsapp",
    "value": "+20 100 000 0000"
  },
  {
    "key": "store_name",
    "value": "CANDELA"
  },
  {
    "key": "tagline",
    "value": "Your Feminine Scent"
  },
  {
    "key": "about",
    "value": "CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day. From luxurious body mists to artisan candles, every product is a sensory experience."
  },
  {
    "key": "instagram",
    "value": "@candela.official"
  },
  {
    "key": "currency",
    "value": "EGP"
  },
  {
    "key": "delivery_note",
    "value": "We will contact you within 24 hours to confirm your order and arrange delivery."
  }
];

async function main() {
  console.log("🌸 Seeding CANDELA database...");
  const hashedPassword = await bcrypt.hash("candela2024", 12);
  await prisma.user.upsert({
    where: { email: "admin@candela.store" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@candela.store",
      password: hashedPassword,
      name: "Candela Owner",
      role: "ADMIN",
    },
  });
  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }
  console.log(`✅ ${products.length} products seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
