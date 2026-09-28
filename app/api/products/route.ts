import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, ensureDbReady, withDbRetry } from "@/lib/db";
import { STATIC_PRODUCTS } from "@/lib/data";
import { slugify } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const featured = searchParams.get("featured");
  const search = searchParams.get("search");

  try {
    await ensureDbReady();
    const products = await withDbRetry(() =>
      prisma.product.findMany({
        where: {
          ...(category && category !== "all" && { category }),
          ...(subcategory && { subcategory }),
          ...(featured === "true" && { isFeatured: true }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { subcategory: { contains: search, mode: "insensitive" } },
            ] as any,
          }),
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      })
    );

    // DB query succeeded — always return the actual database state
    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Database fetch products failed:", error);
    return NextResponse.json({ error: "Failed to load products from database" }, { status: 500 });
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

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    let baseSlug = slugify(body.slug || body.name || "product");
    if (!baseSlug) baseSlug = "product-" + Date.now();

    // Ensure unique slug
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await withDbRetry(() => prisma.product.findUnique({ where: { slug: uniqueSlug } }))) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const product = await withDbRetry(() =>
      prisma.product.create({
        data: {
          name: body.name.trim(),
          slug: uniqueSlug,
          description: body.description?.trim() || "",
          price: typeof body.price === "number" ? body.price : parseFloat(body.price) || 0,
          category: body.category || "body-beauty",
          subcategory: body.subcategory || "General",
          image: body.image?.trim() || "/candela-logo.png",
          inStock: body.inStock !== undefined ? Boolean(body.inStock) : true,
          isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        },
      })
    );

    try {
      revalidatePath("/", "layout");
      revalidatePath("/shop");
      revalidatePath("/admin/products");
      revalidatePath("/api/products");
    } catch {}

    return NextResponse.json(product, {
      status: 201,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
      },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
