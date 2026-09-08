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

  const cleanOrderNumber = orderNumber.trim().toUpperCase();
  const rawPhone = phone.trim();
  const digitsOnlyPhone = rawPhone.replace(/\D/g, "");

  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: cleanOrderNumber,
        user: {
          OR: [
            { phone: rawPhone },
            { phone: digitsOnlyPhone },
            ...(digitsOnlyPhone.startsWith("0")
              ? [{ phone: `+20${digitsOnlyPhone.substring(1)}` }]
              : []),
            ...(digitsOnlyPhone.startsWith("20")
              ? [{ phone: `0${digitsOnlyPhone.substring(2)}` }]
              : []),
          ],
        },
      },
      include: {
        user: { select: { name: true, phone: true } },
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

    return NextResponse.json({
      ...order,
      customer: {
        name: order.user?.name || "Customer",
        phone: order.user?.phone || phone,
      },
    });
  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
  }
}
