import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STATIC_PRODUCTS } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (product) {
      // Try to increment view count, ignore error if read-only
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { views: { increment: 1 } },
        });
      } catch {}

      return NextResponse.json(product);
    }
  } catch (error) {
    console.warn("Database fetch product by id failed:", error);
  }

  // Fallback to static product catalog
  const fallback = STATIC_PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (fallback) {
    return NextResponse.json(fallback);
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.category && { category: body.category }),
        ...(body.subcategory && { subcategory: body.subcategory }),
        ...(body.image && { image: body.image }),
        ...(body.inStock !== undefined && { inStock: body.inStock }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
