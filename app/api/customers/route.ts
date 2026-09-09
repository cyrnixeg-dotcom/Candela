import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    await ensureDbReady();
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
      },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: { orderNumber: true, createdAt: true, total: true, status: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.user.count({
      where: {
        role: "USER",
      },
    });

    const customers = users.map((u) => ({
      id: u.id,
      name: u.name || u.email || "Customer",
      email: u.email,
      phone: u.phone || "—",
      createdAt: u.createdAt,
      orders: u.orders,
      _count: u._count,
      totalSpend: u.orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.total : 0), 0),
    }));

    return NextResponse.json({ customers, total });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ customers: [], total: 0 });
  }
}
