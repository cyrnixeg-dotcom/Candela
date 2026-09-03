import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  try {
    const messages = await prisma.message.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read when admin fetches them
    if (customerId) {
      await prisma.message.updateMany({
        where: { customerId, fromOwner: false, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerName, customerPhone, content, fromOwner } = body;

    let customer;
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
    } else if (customerPhone) {
      customer = await prisma.customer.upsert({
        where: { phone: customerPhone },
        update: {},
        create: { name: customerName || "Customer", phone: customerPhone },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        customerId: customer.id,
        content,
        fromOwner: fromOwner ?? false,
        read: fromOwner ? true : false,
      },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
