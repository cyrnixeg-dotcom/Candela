import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 Starting Candela Comprehensive Subsystem Verification...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & 40 Products Catalog Verification
    console.log("📦 1. Verifying Database & Catalog...");
    const productCount = await prisma.product.count();
    assert(productCount >= 40, `Product catalog has ${productCount} products (expected >= 40)`);

    const sampleProduct = await prisma.product.findFirst({
      where: { slug: "lavender-body-mist" },
    });
    assert(!!sampleProduct, "Lavender Body Mist found in DB by slug");
    assert(sampleProduct?.price === 150, "Product price matches 150 EGP");

    // 2. Admin Account Verification
    console.log("\n👑 2. Verifying Admin Account...");
    const admin = await prisma.user.findUnique({
      where: { email: "admin@candela.store" },
    });
    assert(!!admin, "Admin user exists in database");
    assert(admin?.role === "ADMIN", "Admin role is correctly set to ADMIN");
    if (admin) {
      const isPasswordValid = await bcrypt.compare("candela2024", admin.password);
      assert(isPasswordValid, "Admin password (candela2024) verifies correctly");
    }

    // 3. User Registration & Durable Profile Test
    console.log("\n👤 3. Verifying User Registration & Durable Profile...");
    const testEmail = `test_customer_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash("securepassword123", 10);
    const testUser = await prisma.user.create({
      data: {
        name: "Test Customer",
        email: testEmail,
        password: hashedPassword,
        phone: "+201234567890",
        role: "USER",
      },
    });
    assert(!!testUser.id, `Test user created successfully with ID: ${testUser.id}`);

    // Verify user can be queried back (simulating returning after closing browser)
    const fetchedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(fetchedUser?.email === testEmail, "Customer profile reliably persists and reloads");

    // 4. Order Placement Test (matching by slug and id, foreign key integrity)
    console.log("\n🛍️ 4. Verifying Order Placement & Cart-to-DB mapping...");
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `CND-TEST-${Date.now().toString(36).toUpperCase()}`,
        userId: testUser.id,
        address: "123 Nile Corniche, Apartment 4B",
        city: "Cairo",
        notes: "Please call before arrival",
        total: sampleProduct.price * 2,
        status: "PENDING",
        items: {
          create: [
            {
              productId: sampleProduct.id,
              quantity: 2,
              price: sampleProduct.price,
            },
          ],
        },
      },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });
    assert(!!testOrder.id, `Order successfully created: ${testOrder.orderNumber}`);
    assert(testOrder.items.length === 1, "Order item linked cleanly");
    assert(testOrder.items[0].product.slug === "lavender-body-mist", "Order item linked to correct product record");
    assert(testOrder.total === 300, `Order total correct: ${testOrder.total} EGP`);

    // 5. Account Order History Durability Test
    console.log("\n📜 5. Verifying Customer Account Order Durability...");
    const customerOrders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: testUser.id },
          { user: { email: testEmail } },
        ],
      },
      include: { items: { include: { product: true } } },
    });
    assert(customerOrders.length >= 1, `Customer orders retrieved: ${customerOrders.length}`);
    assert(customerOrders[0].orderNumber === testOrder.orderNumber, "Customer can view their past order history");

    // 6. Admin Order Management & Status Transition Test
    console.log("\n🔄 6. Verifying Admin Order Status Transition...");
    const updatedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: { status: "CONFIRMED" },
    });
    assert(updatedOrder.status === "CONFIRMED", "Order status successfully updated to CONFIRMED");

    const deliveredOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: { status: "DELIVERED" },
    });
    assert(deliveredOrder.status === "DELIVERED", "Order status successfully updated to DELIVERED");

    // 7. Customer & Admin Live Chat Test
    console.log("\n💬 7. Verifying Customer & Admin Messaging...");
    const customerMsg = await prisma.message.create({
      data: {
        userId: testUser.id,
        content: "Hello Candela! When will my order arrive?",
        fromOwner: false,
        read: false,
      },
    });
    assert(!!customerMsg.id, "Customer message successfully saved");

    const ownerReply = await prisma.message.create({
      data: {
        userId: testUser.id,
        content: "Hi! Your order is being prepared and will arrive tomorrow!",
        fromOwner: true,
        read: true,
      },
    });
    assert(!!ownerReply.id, "Owner reply message successfully saved");

    const chatThread = await prisma.message.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: "asc" },
    });
    assert(chatThread.length === 2, "Chat thread correctly contains both customer and owner messages");

    // 8. Site Settings Upsert & Retrieval Test
    console.log("\n⚙️ 8. Verifying Site Settings Management...");
    await prisma.siteSetting.upsert({
      where: { key: "store_tagline_test" },
      update: { value: "Pure Luxury Fragrances" },
      create: { key: "store_tagline_test", value: "Pure Luxury Fragrances" },
    });
    const settingRecord = await prisma.siteSetting.findUnique({
      where: { key: "store_tagline_test" },
    });
    assert(settingRecord?.value === "Pure Luxury Fragrances", "Settings successfully saved and retrieved");
    await prisma.siteSetting.delete({ where: { key: "store_tagline_test" } });

    // 9. Analytics Engine Test
    console.log("\n📊 9. Verifying Analytics Engine...");
    const totalOrders = await prisma.order.count();
    const deliveredCount = await prisma.order.count({ where: { status: "DELIVERED" } });
    const revenue = await prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    });
    assert(totalOrders > 0, `Analytics order count working: ${totalOrders}`);
    assert(deliveredCount > 0, `Analytics delivered count working: ${deliveredCount}`);
    assert(revenue._sum.total > 0, `Analytics revenue calculation working: ${revenue._sum.total} EGP`);

    // 10. Product Creation & Deletion (Admin Product Flow)
    console.log("\n✨ 10. Verifying Admin Product Creation & Deletion...");
    const testProductSlug = `test-candle-${Date.now()}`;
    const newProduct = await prisma.product.create({
      data: {
        name: "Test Scented Candle",
        slug: testProductSlug,
        description: "A test candle with vanilla and amber notes.",
        price: 220,
        category: "candles",
        subcategory: "Soy Candle",
        image: "/candela-logo.png",
        inStock: true,
        isFeatured: true,
      },
    });
    assert(!!newProduct.id, `New product created with ID: ${newProduct.id}`);

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: newProduct.id },
      data: { price: 240 },
    });
    assert(updatedProduct.price === 240, "Product price updated successfully to 240 EGP");

    // Delete product
    await prisma.product.delete({
      where: { id: newProduct.id },
    });
    const deletedCheck = await prisma.product.findUnique({
      where: { id: newProduct.id },
    });
    assert(deletedCheck === null, "Product cleanly deleted from database");

    // 11. Cleanup test records
    console.log("\n🧹 11. Cleaning up test data...");
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.message.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    assert(true, "Test data cleanly deleted, database remains in pristine state");

    console.log(`\n========================================`);
    console.log(`🎉 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal error during test execution:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
