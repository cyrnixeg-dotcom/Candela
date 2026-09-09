import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const role = searchParams.get("role") || "admin";
  const summary = searchParams.get("summary");

  try {
    await ensureDbReady();

    // Fast summary mode for background admin notification polling
    if (summary === "true") {
      const unreadCount = await prisma.message.count({
        where: { fromOwner: false, read: false, content: { not: "[CHAT_ENDED]" } },
      });
      const latestMessage = await prisma.message.findFirst({
        where: { fromOwner: false, read: false, content: { not: "[CHAT_ENDED]" } },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, phone: true } } },
      });
      return NextResponse.json({
        unreadCount,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              customerId: latestMessage.userId,
              customerName: latestMessage.user?.name || "Customer",
              customerPhone: latestMessage.user?.phone || "—",
              createdAt: latestMessage.createdAt,
            }
          : null,
      });
    }

    const messages = await prisma.message.findMany({
      where: customerId ? { userId: customerId } : {},
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read based on who is fetching
    if (customerId) {
      if (role === "admin") {
        await prisma.message.updateMany({
          where: { userId: customerId, fromOwner: false, read: false },
          data: { read: true },
        });
      } else {
        // Customer fetching: mark owner messages as read
        await prisma.message.updateMany({
          where: { userId: customerId, fromOwner: true, read: false },
          data: { read: true },
        });
      }
    }

    const formatted = messages.map((m) => ({
      id: m.id,
      content: m.content,
      fromOwner: m.fromOwner,
      read: m.read,
      createdAt: m.createdAt,
      customerId: m.userId,
      isEndChat: m.content === "[CHAT_ENDED]",
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
    await ensureDbReady();
    const body = await request.json();
    const { customerId, customerName, customerPhone, action, fromOwner } = body;
    let content = body.content;

    if (action === "END_CHAT") {
      content = "[CHAT_ENDED]";
    } else if (action === "REOPEN_CHAT") {
      content = content || "Chat resumed.";
    }

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
