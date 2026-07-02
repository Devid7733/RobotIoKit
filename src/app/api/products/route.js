import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toClientErrorMessage } from "@/lib/apiError";
import {
  createProduct,
  listAdminProducts,
  listFeaturedStorefrontProducts,
  listStorefrontProducts
} from "@/services/productService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "admin") {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
      }

      const products = await listAdminProducts();
      return NextResponse.json({ ok: true, data: products });
    }

    const categorySlug = searchParams.get("category") || undefined;
    const voltage = searchParams.get("voltage") || undefined;
    const search = searchParams.get("search") || undefined;
    const maxPrice = searchParams.get("maxPrice") || undefined;
    const minPrice = searchParams.get("minPrice") || undefined;
    const inStock = searchParams.get("inStock") === "true";
    const featuredOnly = searchParams.get("featured") === "true";
    const limitValue = Number(searchParams.get("limit") || 0);

    const products = featuredOnly
      ? await listFeaturedStorefrontProducts(limitValue > 0 ? limitValue : 8)
      : await listStorefrontProducts(categorySlug, voltage, search, maxPrice, minPrice, inStock);

    return NextResponse.json({ ok: true, data: products });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to load products.")
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const product = await createProduct(body);

    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to create product.")
      },
      { status: 500 }
    );
  }
}
