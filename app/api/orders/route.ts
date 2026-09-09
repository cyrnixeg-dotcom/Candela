import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STATIC_PRODUCTS } from "@/lib/data";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.order.count({
      where: status ? { status } : {},
    });

    const normalisedOrders = orders.map((o) => ({
      ...o,
      customer: {
        name: o.user?.name || o.user?.email || "Customer",
        phone: (o.user as any)?.phone || "—",
      },
    }));

    return NextResponse.json({ orders: normalisedOrders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { customerName, customerPhone, address, city, notes, items } = body;

    if (!address || !city || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let dbUser = null;

    // 1. If logged in, look up the existing account
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (dbUser && customerPhone && !dbUser.phone) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { phone: customerPhone, name: customerName || dbUser.name },
        });
      }
    }

    // 2. If guest (not logged in), find or create a user by phone/name
    if (!dbUser) {
      if (customerPhone) {
        dbUser = await prisma.user.findFirst({
          where: { phone: customerPhone },
        });
      }
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: customerName || "Guest Customer",
            phone: customerPhone || null,
            role: "USER",
          },
        });
      } else if (customerName && (!dbUser.name || dbUser.name === "Guest Customer")) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { name: customerName },
        });
      }
    }

    // Calculate total from DB prices (matching by either id or slug)
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: productIds } },
          { slug: { in: productIds } },
        ],
      },
    });

    let total = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      let product: any = products.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) {
        const staticP = STATIC_PRODUCTS.find((p) => p.id === item.productId || p.slug === item.productId);
        if (staticP) {
          try {
            product = await prisma.product.upsert({
              where: { slug: staticP.slug },
              update: {},
              create: {
                name: staticP.name,
                slug: staticP.slug,
                description: staticP.description,
                price: staticP.price,
                category: staticP.category,
                subcategory: staticP.subcategory,
                image: staticP.image,
                inStock: staticP.inStock,
                isFeatured: staticP.isFeatured,
              },
            });
          } catch {
            product = await prisma.product.findFirst({
              where: { OR: [{ id: staticP.id }, { slug: staticP.slug }] },
            });
          }
        }
      }

      if (!product) {
        return NextResponse.json(
          { error: "One or more items in your bag are no longer available. Please review your cart." },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.min(99, item.quantity || 1));
      const itemTotal = product.price * qty;
      total += itemTotal;
      orderItems.push({
        productId: product.id, // Always use real DB product.id for foreign key
        quantity: qty,
        price: product.price,
      });
    }

    // Create order with collision-resistant loop
    let order = null;
    let attempts = 0;
    while (!order && attempts < 3) {
      attempts++;
      try {
        order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: dbUser.id,
            address,
            city,
            notes: notes || null,
            total,
            status: "PENDING",
            items: {
              create: orderItems,
            },
          },
          include: {
            user: true,
            items: { include: { product: true } },
          },
        });
      } catch (createErr: any) {
        if (attempts >= 3) throw createErr;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Could not complete order. Please try again." }, { status: 500 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
