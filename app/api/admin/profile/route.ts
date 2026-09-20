import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureDbReady } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  await ensureDbReady();
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { id: (session.user as any).id },
        { email: session.user?.email || "" },
        { role: "ADMIN" },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ name: admin.name || "Candela Admin", email: admin.email });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDbReady();
    const { name, email, password } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email taken by another user
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const adminId = (session.user as any)?.id;
    const sessionEmail = session.user?.email?.toLowerCase();

    // Find target admin record
    let targetAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          ...(adminId && adminId !== "admin-master" ? [{ id: adminId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
          { role: "ADMIN" },
        ],
      },
    });

    if (targetAdmin) {
      // Check if email taken by another user
      const existingOther = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: targetAdmin.id },
        },
      });

      if (existingOther) {
        return NextResponse.json({ error: "This email is already in use by another account" }, { status: 400 });
      }
    }

    const updateData: any = {
      name: name?.trim() || "Candela Admin",
      email: cleanEmail,
      role: "ADMIN",
    };

    if (password && password.trim().length > 0) {
      if (password.trim().length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters long" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    let updatedAdmin;
    if (targetAdmin) {
      updatedAdmin = await prisma.user.update({
        where: { id: targetAdmin.id },
        data: updateData,
      });
    } else {
      updatedAdmin = await prisma.user.create({
        data: {
          ...updateData,
          password: updateData.password || (await bcrypt.hash("candela2024", 10)),
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: { name: updatedAdmin?.name, email: updatedAdmin?.email },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json({ error: "Failed to update admin credentials" }, { status: 500 });
  }
}
