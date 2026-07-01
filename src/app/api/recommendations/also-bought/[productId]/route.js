import { NextResponse } from "next/server";
import { getAlsoBoughtProducts } from "@/services/productService";

export async function GET(request, { params }) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 6), 12);

    if (!productId) {
      return NextResponse.json({ ok: false, message: "Product ID is required." }, { status: 400 });
    }

    const products = await getAlsoBoughtProducts(productId, limit);
    return NextResponse.json({ ok: true, data: products });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load recommendations." },
      { status: 500 }
    );
  }
}
