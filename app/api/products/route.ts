import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STATIC_PRODUCTS } from "@/lib/data";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const featured = searchParams.get("featured");
  const search = searchParams.get("search");

  try {
    const products = await prisma.product.findMany({
      where: {
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(featured === "true" && { isFeatured: true }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { subcategory: { contains: search } },
          ],
        }),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    if (products && products.length > 0) {
      return NextResponse.json(products);
    }
  } catch (error) {
    console.warn("Database fetch products failed, falling back to static catalog:", error);
  }

  // Resilient fallback: return static catalog
  let results = [...STATIC_PRODUCTS];
  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }
  if (subcategory) {
    results = results.filter((p) => p.subcategory === subcategory);
  }
  if (featured === "true") {
    results = results.filter((p) => p.isFeatured);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let baseSlug = slugify(body.slug || body.name || "product");
    if (!baseSlug) baseSlug = "product-" + Date.now();

    // Ensure unique slug
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const product = await prisma.product.create({
      data: {
        name: body.name || "Untitled Product",
        slug: uniqueSlug,
        description: body.description || "",
        price: parseFloat(body.price) || 0,
        category: body.category || "body-beauty",
        subcategory: body.subcategory || "General",
        image: body.image || "/candela-logo.png",
        inStock: body.inStock ?? true,
        isFeatured: body.isFeatured ?? false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
