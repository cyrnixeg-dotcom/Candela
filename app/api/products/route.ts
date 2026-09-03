import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        category: body.category,
        subcategory: body.subcategory,
        image: body.image,
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
