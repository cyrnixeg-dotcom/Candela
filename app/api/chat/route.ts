import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  try {
    const messages = await prisma.message.findMany({
      where: customerId ? { userId: customerId } : {},
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read when admin fetches them
    if (customerId) {
      await prisma.message.updateMany({
        where: { userId: customerId, fromOwner: false, read: false },
        data: { read: true },
      });
    }

    const formatted = messages.map((m) => ({
      id: m.id,
      content: m.content,
      fromOwner: m.fromOwner,
      read: m.read,
      createdAt: m.createdAt,
      customerId: m.userId,
      customer: {
        name: m.user?.name || "Customer",
        phone: m.user?.phone || "—",
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerName, customerPhone, content, fromOwner } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    let user;
    if (customerId) {
      user = await prisma.user.findUnique({ where: { id: customerId } });
    } else if (customerPhone) {
      user = await prisma.user.findFirst({ where: { phone: customerPhone } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: customerName || "Customer",
            phone: customerPhone,
            role: "USER",
          },
        });
      } else if (customerName && user.name !== customerName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: customerName },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: customerName || "Guest Visitor",
          phone: customerPhone || null,
          role: "USER",
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        userId: user.id,
        content,
        fromOwner: fromOwner ?? false,
        read: fromOwner ? true : false,
      },
      include: {
        user: { select: { name: true, phone: true } },
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        content: message.content,
        fromOwner: message.fromOwner,
        read: message.read,
        createdAt: message.createdAt,
        customerId: message.userId,
        customer: {
          name: message.user?.name || "Customer",
          phone: message.user?.phone || "—",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
