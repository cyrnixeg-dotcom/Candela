import { NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // If user already exists as a guest checkout without a password, activate their account
    if (existingUser) {
      if (existingUser.password) {
        return NextResponse.json(
          { error: "Email already registered. Please sign in." },
          { status: 400 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name?.trim() || existingUser.name || "Customer",
          password: hashedPassword,
        },
      });

      return NextResponse.json({
        user: { id: updated.id, email: updated.email, name: updated.name },
      });
    }

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || "Customer",
        email: cleanEmail,
        password: hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
