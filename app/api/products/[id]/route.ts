import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, ensureDbReady } from "@/lib/db";
import { STATIC_PRODUCTS } from "@/lib/data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureDbReady();
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

      return NextResponse.json(product, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      });
    }

    // Product was checked in DB and not found -> return 404
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.warn("Database fetch product by id failed, checking static fallback:", error);
  }

  // Fallback to static product catalog only if database connection failed
  const fallback = STATIC_PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (fallback) {
    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureDbReady();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Determine unique slug if slug or name is modified
    let newSlug = existing.slug;
    if (body.slug && typeof body.slug === "string" && body.slug.trim()) {
      const candidateSlug = body.slug.trim();
      if (candidateSlug !== existing.slug) {
        newSlug = candidateSlug;
        let count = 1;
        while (
          await prisma.product.findFirst({
            where: { slug: newSlug, NOT: { id: existing.id } },
          })
        ) {
          newSlug = `${candidateSlug}-${count++}`;
        }
      }
    } else if (body.name && typeof body.name === "string" && body.name.trim() && body.name.trim() !== existing.name) {
      const candidateSlug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (candidateSlug && candidateSlug !== existing.slug) {
        newSlug = candidateSlug;
        let count = 1;
        while (
          await prisma.product.findFirst({
            where: { slug: newSlug, NOT: { id: existing.id } },
          })
        ) {
          newSlug = `${candidateSlug}-${count++}`;
        }
      }
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        slug: newSlug,
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && {
          price: typeof body.price === "number" ? body.price : parseFloat(body.price) || 0,
        }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
        ...(body.image !== undefined && { image: body.image?.trim() || "/candela-logo.png" }),
        ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
        ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/shop");
      revalidatePath("/admin/products");
      revalidatePath("/api/products");
      revalidatePath(`/product/${product.id}`);
      revalidatePath(`/product/${product.slug}`);
    } catch {}

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureDbReady();
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Safely remove any order items referencing this product to avoid foreign key violations
    try {
      await prisma.orderItem.deleteMany({
        where: { productId: existing.id },
      });
    } catch (itemErr) {
      console.warn("Could not delete associated order items:", itemErr);
    }

    await prisma.product.delete({ where: { id: existing.id } });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/shop");
      revalidatePath("/admin/products");
      revalidatePath("/api/products");
      revalidatePath(`/product/${existing.id}`);
      revalidatePath(`/product/${existing.slug}`);
    } catch {}

    return NextResponse.json({ success: true, id: existing.id }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}

