import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  // ===== BODY & BEAUTY — Body Mist =====
  {
    name: "Dark Kiss Body Mist",
    slug: "dark-kiss-body-mist",
    description: "A mysterious, sensual mist that captures the essence of midnight romance. Dark florals with a hint of amber and musk.",
    price: 55,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/dark-kiss-body-mist.jpg",
    isFeatured: true,
  },
  {
    name: "Into The Night Body Mist",
    slug: "into-the-night-body-mist",
    description: "A golden shimmer mist for the woman who owns the night. Warm amber and vanilla wrapped in glittering dust.",
    price: 55,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/into-the-night-body-mist.jpg",
    isFeatured: true,
  },
  {
    name: "Kayali Vanilla 28 Body Mist",
    slug: "kayali-vanilla-28-body-mist",
    description: "Inspired by the iconic scent, a warm vanilla dream with rich gourmand notes. Pure sweetness in a bottle.",
    price: 55,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/kayali-vanilla-28-body-mist.jpg",
    isFeatured: false,
  },
  {
    name: "Yara Candy Body Mist",
    slug: "yara-candy-body-mist",
    description: "Playfully feminine and irresistibly sweet. Fruity candy notes with a fresh floral heart.",
    price: 55,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/yara-candy-body-mist.jpg",
    isFeatured: false,
  },
  {
    name: "Baccarat Rouge Body Mist",
    slug: "baccarat-rouge-body-mist",
    description: "Inspired by the legendary Baccarat Rouge 540. A luminous, woody, saffron-tinted haze that leaves a statement.",
    price: 60,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/baccarat-rouge-body-mist.jpg",
    isFeatured: true,
  },
  {
    name: "In The Stars Body Mist",
    slug: "in-the-stars-body-mist",
    description: "Sparkling and celestial. A warm musk blended with notes of peony and sandalwood. Glitter-infused magic.",
    price: 55,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/in-the-stars-body-mist.jpg",
    isFeatured: false,
  },
  {
    name: "Khomra Body Mist",
    slug: "khomra-body-mist",
    description: "A rich oriental mist inspired by tradition. Deep oud, warm spices, and a golden amber trail.",
    price: 60,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/khomra-body-mist.jpg",
    isFeatured: false,
  },
  {
    name: "Gingham Body Mist",
    slug: "gingham-body-mist",
    description: "Fresh, clean, and effortlessly beautiful. A light floral body mist that's perfect for everyday elegance.",
    price: 50,
    category: "body-beauty",
    subcategory: "Body Mist",
    image: "/images/products/gingham-body-mist.jpg",
    isFeatured: false,
  },

  // ===== BODY & BEAUTY — Perfume Oil =====
  {
    name: "Scandal Perfume Oil",
    slug: "scandal-perfume-oil",
    description: "Bold, daring, and unforgettable. A vibrant fruity floral that makes every entrance a statement.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/scandal-perfume-oil.jpg",
    isFeatured: true,
  },
  {
    name: "Thousand Wishes Perfume Oil",
    slug: "thousand-wishes-perfume-oil",
    description: "Warm, sparkling, and full of dreams. Almond blossom, golden peach, and cozy sandalwood.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/thousand-wishes-perfume-oil.jpg",
    isFeatured: false,
  },
  {
    name: "Dark Kiss Perfume Oil",
    slug: "dark-kiss-perfume-oil",
    description: "Dark berries meet black cherry and soft rose. A forbidden, romantic scent that lingers all day.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/dark-kiss-perfume-oil.jpg",
    isFeatured: false,
  },
  {
    name: "Good Girl Perfume Oil",
    slug: "good-girl-perfume-oil",
    description: "The duality of feminine power. Jasmine and tuberose over cocoa and tonka bean.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/good-girl-perfume-oil.jpg",
    isFeatured: true,
  },
  {
    name: "Little Stars Perfume Oil",
    slug: "little-stars-perfume-oil",
    description: "A whimsical, sparkling scent inspired by stardust. Warm vanilla with citrus sparkle.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/little-stars-perfume-oil.jpg",
    isFeatured: false,
  },
  {
    name: "Crazy Love Perfume Oil",
    slug: "crazy-love-perfume-oil",
    description: "Passionate and wild. A bold, irresistible blend of red berries, rose, and warm musk.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/crazy-love-perfume-oil.jpg",
    isFeatured: false,
  },
  {
    name: "In The Stars Perfume Oil",
    slug: "in-the-stars-perfume-oil",
    description: "Soft, dreamy, and celestial. A glittering warmth of peony, musk, and sandalwood.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/in-the-stars-perfume-oil.jpg",
    isFeatured: false,
  },
  {
    name: "Lavander Perfume Oil",
    slug: "lavander-perfume-oil",
    description: "Soothing and elegant. Pure lavender notes with a soft floral heart and warm base.",
    price: 35,
    category: "body-beauty",
    subcategory: "Perfume Oil",
    image: "/images/products/lavander-perfume-oil.jpg",
    isFeatured: false,
  },

  // ===== BODY & BEAUTY — Body Serum =====
  {
    name: "Body Serum by Candela",
    slug: "body-serum-candela",
    description: "A luxurious gold-infused body serum that nourishes, illuminates, and leaves skin with a radiant, dewy glow.",
    price: 85,
    category: "body-beauty",
    subcategory: "Body Serum",
    image: "/images/products/body-serum.jpg",
    isFeatured: true,
  },

  // ===== BODY & BEAUTY — Body Lotion =====
  {
    name: "Body Lotion by Candela",
    slug: "body-lotion-candela",
    description: "Rich, creamy, and deeply moisturizing. A feminine scented lotion that wraps your skin in softness all day.",
    price: 75,
    category: "body-beauty",
    subcategory: "Body Lotion",
    image: "/images/products/body-lotion-pump.jpg",
    isFeatured: false,
  },
  {
    name: "Body Lotion Mini",
    slug: "body-lotion-mini",
    description: "The same luxurious Candela formula in a travel-friendly size. Perfect for on-the-go softness.",
    price: 45,
    category: "body-beauty",
    subcategory: "Body Lotion",
    image: "/images/products/body-lotion-jar.jpg",
    isFeatured: false,
  },

  // ===== BODY & BEAUTY — Makhmaria =====
  {
    name: "Makhmaria — Red",
    slug: "makhmaria-red",
    description: "A traditional Makhmaria in deep red. A concentrated solid perfume with rich oriental warmth.",
    price: 30,
    category: "body-beauty",
    subcategory: "Makhmaria",
    image: "/images/products/makhmaria-red.jpg",
    isFeatured: false,
  },
  {
    name: "Makhmaria — Pink",
    slug: "makhmaria-pink",
    description: "A soft rose Makhmaria. Delicately feminine, this solid perfume is perfect for sensitive skin.",
    price: 30,
    category: "body-beauty",
    subcategory: "Makhmaria",
    image: "/images/products/makhmaria-pink.jpg",
    isFeatured: false,
  },
  {
    name: "Makhmaria Duo Pack",
    slug: "makhmaria-duo",
    description: "The perfect pair. Both Makhmaria scents in one beautiful set. A gift for yourself or someone you love.",
    price: 55,
    category: "body-beauty",
    subcategory: "Makhmaria",
    image: "/images/products/makhmaria-duo.jpg",
    isFeatured: false,
  },

  // ===== CANDLES =====
  {
    name: "Vangokh Candle Jar",
    slug: "vangokh-candle-jar",
    description: "Art meets ambiance. The iconic Starry Night by Van Gogh comes alive on this stunning candle jar. 100% natural wax, wooden lid.",
    price: 120,
    category: "candles",
    subcategory: "Vangokh Candle Jar",
    image: "/images/products/vangokh-candle-jar.jpg",
    isFeatured: true,
  },
  {
    name: "Massage Candle",
    slug: "massage-candle",
    description: "A dual-purpose luxury candle that melts into a warm, nourishing massage oil. Rose, vanilla, and soft musk.",
    price: 95,
    category: "candles",
    subcategory: "Massage Candle",
    image: "/images/products/massage-candle.jpg",
    isFeatured: true,
  },

  // ===== HOME & CAR =====
  {
    name: "Car Diffuser",
    slug: "car-diffuser",
    description: "Transform your drive into a luxury experience. This beautiful amber glass diffuser fills your car with Candela's signature scent.",
    price: 45,
    category: "home-car",
    subcategory: "Car Diffuser",
    image: "/images/products/car-diffuser.jpg",
    isFeatured: true,
  },
];

const siteSettings = [
  { key: "phone", value: "+20 100 000 0000" },
  { key: "whatsapp", value: "+20 100 000 0000" },
  { key: "store_name", value: "CANDELA" },
  { key: "tagline", value: "Your Feminine Scent" },
  { key: "about", value: "CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day. From luxurious body mists to artisan candles, every product is a sensory experience." },
  { key: "instagram", value: "@candela.official" },
  { key: "currency", value: "EGP" },
  { key: "delivery_note", value: "We will contact you within 24 hours to confirm your order and arrange delivery." },
];

async function main() {
  console.log("🌸 Seeding CANDELA database...");

  // Create admin
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
  console.log("✅ Admin account created: admin@candela.store / candela2024");

  // Create site settings
  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ Site settings seeded");

  // Create products
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${products.length} products seeded`);
  console.log("🎉 CANDELA database ready!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
