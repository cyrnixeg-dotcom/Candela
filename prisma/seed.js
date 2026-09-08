// Plain JavaScript seed script — fallback if ts-node fails
// Run: node prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const products = [
  // Body Mist
  { name: "Dark Kiss Body Mist", slug: "dark-kiss-body-mist", description: "A mysterious, sensual mist that captures midnight romance. Dark florals with amber and musk.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/dark-kiss-body-mist.jpg", isFeatured: true },
  { name: "Into The Night Body Mist", slug: "into-the-night-body-mist", description: "A golden shimmer mist for the woman who owns the night. Warm amber and vanilla.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/into-the-night-body-mist.jpg", isFeatured: true },
  { name: "Kayali Vanilla 28 Body Mist", slug: "kayali-vanilla-28-body-mist", description: "Inspired by the iconic scent, a warm vanilla dream with rich gourmand notes.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/kayali-vanilla-28-body-mist.jpg", isFeatured: false },
  { name: "Yara Candy Body Mist", slug: "yara-candy-body-mist", description: "Playfully feminine and irresistibly sweet. Fruity candy notes with a fresh floral heart.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/yara-candy-body-mist.jpg", isFeatured: false },
  { name: "Baccarat Rouge Body Mist", slug: "baccarat-rouge-body-mist", description: "Inspired by the legendary Baccarat Rouge 540. A luminous, woody, saffron-tinted haze.", price: 60, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/baccarat-rouge-body-mist.jpg", isFeatured: true },
  { name: "In The Stars Body Mist", slug: "in-the-stars-body-mist", description: "Dreamy, starlit shimmer mist. Soft white florals and warm musk that glows on skin.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/in-the-stars-body-mist.jpg", isFeatured: false },
  { name: "Khomra Body Mist", slug: "khomra-body-mist", description: "Rich oriental warmth inspired by traditional Arabic perfumery. Oud, amber, and spice.", price: 60, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/khomra-body-mist.jpg", isFeatured: false },
  { name: "Gingham Body Mist", slug: "gingham-body-mist", description: "Clean, fresh and cheerful. Bright citrus notes over a soft floral heart.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/gingham-body-mist.jpg", isFeatured: false },
  { name: "Lavender Body Mist", slug: "lavender-body-mist", description: "Soothing and serene lavender mist. Perfect for winding down or refreshing throughout the day.", price: 55, category: "body-beauty", subcategory: "Body Mist", image: "/images/products/lavander-body-mist.jpg", isFeatured: false },
  // Perfume Oils
  { name: "Scandal Perfume Oil", slug: "scandal-perfume-oil", description: "Bold, seductive, unforgettable. A feminine oriental scent with honey, mandarin, and caramel.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/scandal-perfume-oil.jpg", isFeatured: true },
  { name: "Thousand Wishes Perfume Oil", slug: "thousand-wishes-perfume-oil", description: "Warm sparkling champagne, almond blossom, and sandalwood. A celebration in a bottle.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/thousand-wishes-perfume-oil.jpg", isFeatured: true },
  { name: "Dark Kiss Perfume Oil", slug: "dark-kiss-perfume-oil", description: "Seductive berry and black rose with a warm vanilla musk base. Deeply feminine.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/dark-kiss-perfume-oil.jpg", isFeatured: false },
  { name: "Good Girl Perfume Oil", slug: "good-girl-perfume-oil", description: "Duality of light and dark. Jasmine and tuberose over cocoa and tonka bean.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/good-girl-perfume-oil.jpg", isFeatured: false },
  { name: "Little Stars Perfume Oil", slug: "little-stars-perfume-oil", description: "Whimsical, soft, and magical. Light florals and clean musk. Perfect for everyday glow.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/little-stars-perfume-oil.jpg", isFeatured: false },
  { name: "Crazy Love Perfume Oil", slug: "crazy-love-perfume-oil", description: "A passionate floral oriental. Rose, patchouli, and vanilla entwined in a romantic embrace.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/crazy-love-perfume-oil.jpg", isFeatured: false },
  { name: "In The Stars Perfume Oil", slug: "in-the-stars-perfume-oil", description: "Celestial and soft. Starlit musk with delicate white floral and warm amber.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/in-the-stars-perfume-oil.jpg", isFeatured: false },
  { name: "Lavender Perfume Oil", slug: "lavander-perfume-oil", description: "Pure, calming lavender with a hint of vanilla and clean musk.", price: 35, category: "body-beauty", subcategory: "Perfume Oil", image: "/images/products/lavander-perfume-oil.jpg", isFeatured: false },
  // Body Serum
  { name: "Body Serum", slug: "body-serum", description: "A luxurious illuminating body serum that nourishes deeply while leaving your skin with a radiant, golden glow.", price: 85, category: "body-beauty", subcategory: "Body Serum", image: "/images/products/body-serum.jpg", isFeatured: true },
  // Body Lotion
  { name: "Body Lotion (Pump)", slug: "body-lotion-pump", description: "Rich, velvety body lotion that melts into skin. Deeply moisturising with a lasting fragrance.", price: 70, category: "body-beauty", subcategory: "Body Lotion", image: "/images/products/body-lotion-pump.jpg", isFeatured: false },
  { name: "Body Lotion (Jar)", slug: "body-lotion-jar", description: "Indulgent whipped body lotion in a luxury jar. Silky-smooth with a feminine fragrance trail.", price: 75, category: "body-beauty", subcategory: "Body Lotion", image: "/images/products/body-lotion-jar.jpg", isFeatured: false },
  // Makhmaria
  { name: "Makhmaria Red", slug: "makhmaria-red", description: "A bold, precious traditional Arabic solid perfume. Rich oud, rose, and amber in concentrated form.", price: 45, category: "body-beauty", subcategory: "Makhmaria", image: "/images/products/makhmaria-red.jpg", isFeatured: false },
  { name: "Makhmaria Pink", slug: "makhmaria-pink", description: "Feminine and romantic solid perfume. Rose petals and soft musk in a beautiful pink compact.", price: 45, category: "body-beauty", subcategory: "Makhmaria", image: "/images/products/makhmaria-pink.jpg", isFeatured: false },
  { name: "Makhmaria Duo", slug: "makhmaria-duo", description: "The ultimate Candela gift — both Makhmaria scents together in an elegant duo set.", price: 80, category: "body-beauty", subcategory: "Makhmaria", image: "/images/products/makhmaria-duo.jpg", isFeatured: true },
  // Candles
  { name: "Vangokh Candle Jar", slug: "vangokh-candle-jar", description: "An artistic candle jar featuring a Van Gogh Starry Night inspired label. A perfect gift and statement piece.", price: 120, category: "candles", subcategory: "Vangokh Candle Jar", image: "/images/products/vangokh-candle-jar.jpg", isFeatured: true },
  { name: "Massage Candle", slug: "massage-candle", description: "A luxurious dual-purpose candle that melts into a warm, nourishing massage oil. Romance meets self-care.", price: 95, category: "candles", subcategory: "Massage Candle", image: "/images/products/massage-candle.jpg", isFeatured: true },
  // Home & Car
  { name: "Car Diffuser", slug: "car-diffuser", description: "A premium car diffuser with an amber stone bead on a rich red cord. Fill your car with your favourite Candela scent.", price: 45, category: "home-car", subcategory: "Car Diffuser", image: "/images/products/car-diffuser.jpg", isFeatured: true },
];

async function main() {
  console.log("🌸 Seeding Candela database...");

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.message.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.product.deleteMany();
  await prisma.admin.deleteMany();

  // Seed products
  console.log(`📦 Seeding ${products.length} products...`);
  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        inStock: true,
        views: Math.floor(Math.random() * 100),
      },
    });
  }

  // Seed admin
  console.log("👑 Creating admin account...");
  const hashedPassword = await bcrypt.hash("candela2024", 12);
  await prisma.admin.create({
    data: {
      email: "admin@candela.store",
      password: hashedPassword,
      name: "Candela Admin",
    },
  });

  // Seed site settings
  console.log("⚙️ Setting up site settings...");
  const settings = [
    { key: "phone", value: "+20 100 000 0000" },
    { key: "whatsapp", value: "+20 100 000 0000" },
    { key: "store_name", value: "CANDELA" },
    { key: "tagline", value: "Your Feminine Scent" },
    { key: "about", value: "CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day." },
    { key: "instagram", value: "@candela.official" },
    { key: "currency", value: "EGP" },
    { key: "delivery_note", value: "We will contact you within 24 hours to confirm your order and arrange delivery." },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.create({ data: setting });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`   ├── ${products.length} products created`);
  console.log("   ├── 1 admin account (admin@candela.store / candela2024)");
  console.log("   └── Site settings initialized");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
