import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDeviceType } from "@/lib/utils";

export async function GET() {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      totalVisitors,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "CONFIRMED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.user.count({
        where: {
          OR: [{ role: "USER" }, { orders: { some: {} } }],
        },
      }),
      prisma.product.count(),
      prisma.analyticsEvent.groupBy({ by: ["sessionId"] }).then((r) => r.length).catch(() => 0),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      }),
      prisma.product.findMany({
        orderBy: { views: "desc" },
        take: 5,
        select: { id: true, name: true, views: true, image: true, subcategory: true },
      }),
    ]);

    // Revenue
    const revenueData = await prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } }));

    // Orders by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEvents = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, total: true },
    }).catch(() => []);

    // Normalise recentOrders so admin UI still gets a `customer` field
    const normalisedOrders = (recentOrders || []).map((o) => ({
      ...o,
      customer: {
        name: o.user?.name || o.user?.email || "Customer",
        phone: o.user?.phone || "—",
      },
    }));

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        confirmedOrders: confirmedOrders || 0,
        deliveredOrders: deliveredOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        totalVisitors: totalVisitors || 0,
        totalRevenue: revenueData?._sum?.total || 0,
        conversionRate:
          (totalVisitors || 0) > 0
            ? (((totalOrders || 0) / totalVisitors) * 100).toFixed(1)
            : "0.0",
      },
      recentOrders: normalisedOrders,
      topProducts: topProducts || [],
      recentEvents: recentEvents || [],
    });
  } catch (error) {
    console.error("Analytics error:", error);
    // Return resilient fallback data to prevent dashboard crash
    return NextResponse.json({
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        totalVisitors: 0,
        totalRevenue: 0,
        conversionRate: "0.0",
      },
      recentOrders: [],
      topProducts: [],
      recentEvents: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get("user-agent") || "";

    await prisma.analyticsEvent.create({
      data: {
        sessionId: body.sessionId,
        page: body.page,
        productId: body.productId || null,
        deviceType: getDeviceType(userAgent),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ success: false });
  }
}
