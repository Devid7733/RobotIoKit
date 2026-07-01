import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteProduct, getProductById, updateProduct } from "@/services/productService";

function getErrorMessage(error) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export async function GET(request, { params }) {
  try {
    const product = await getProductById(params.id);

    if (!product) {
      return NextResponse.json({ ok: false, message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const product = await updateProduct(params.id, body);

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    await deleteProduct(params.id);

    return NextResponse.json({ ok: true, message: "Product deleted." });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
