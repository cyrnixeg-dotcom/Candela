import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/db";

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
    await ensureDbReady();
    // 1. Find the order by orderNumber first
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: cleanOrderNumber,
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
        { error: "Order not found. Please verify your order number." },
        { status: 404 }
      );
    }

    // 2. Validate phone number with format tolerance (matching last 8-9 digits)
    const dbPhoneDigits = (order.user?.phone || "").replace(/\D/g, "");
    const inputPhoneDigits = digitsOnlyPhone;

    const phoneMatches =
      !inputPhoneDigits ||
      !dbPhoneDigits ||
      dbPhoneDigits === inputPhoneDigits ||
      dbPhoneDigits.endsWith(inputPhoneDigits) ||
      inputPhoneDigits.endsWith(dbPhoneDigits) ||
      (dbPhoneDigits.length >= 8 && inputPhoneDigits.length >= 8 &&
        dbPhoneDigits.slice(-8) === inputPhoneDigits.slice(-8));

    if (!phoneMatches) {
      return NextResponse.json(
        { error: "The phone number does not match this order number. Please check the phone number used at checkout." },
        { status: 400 }
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
