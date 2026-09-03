import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Track order by order number + phone
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");
  const phone = searchParams.get("phone");

  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: "Order number and phone are required" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customer: { phone },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, image: true, subcategory: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your order number and phone number." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
  }
}
