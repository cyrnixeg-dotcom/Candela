import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, ensureDbReady } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_SETTINGS: Record<string, string> = {
  phone: "+20 100 000 0000",
  whatsapp: "+20 100 000 0000",
  store_name: "CANDELA",
  tagline: "Your Feminine Scent",
  about: "CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day.",
  instagram: "@candela.official",
  currency: "EGP",
  delivery_note: "We will contact you within 24 hours to confirm your order and arrange delivery.",
};

export async function GET() {
  try {
    await ensureDbReady();
    const settings = await prisma.siteSetting.findMany();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, { ...DEFAULT_SETTINGS });
    return NextResponse.json(settingsMap, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(DEFAULT_SETTINGS, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    for (const [key, value] of Object.entries(body)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }

    try {
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/shop");
      revalidatePath("/api/settings");
    } catch {}

    return NextResponse.json({ success: true }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
