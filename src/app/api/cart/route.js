import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity
} from "@/modules/cart/cart.service";

function errorMessage(error) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export async function GET() {
  try {
    const session = await auth();
    const cart = await getCart({
      userId: session?.user?.id
    });

    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    return NextResponse.json({ ok: false, message: errorMessage(error) }, { status: error?.status || 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    const body = await request.json();
    const cart = await addToCart({
      userId: session?.user?.id,
      productId: body.productId || null,
      robotKitId: body.robotKitId || null,
      quantity: body.quantity || 1
    });

    return NextResponse.json({ ok: true, data: cart }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: errorMessage(error) }, { status: error?.status || 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    const body = await request.json();
    const cart = await updateCartItemQuantity({
      userId: session?.user?.id,
      cartItemId: body.cartItemId,
      quantity: body.quantity
    });

    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    return NextResponse.json({ ok: false, message: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    const body = await request.json().catch(() => ({}));
    const cart = body.cartItemId
      ? await removeCartItem({
          userId: session?.user?.id,
          cartItemId: body.cartItemId
        })
      : await clearCart({
          userId: session?.user?.id
        });

    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    return NextResponse.json({ ok: false, message: errorMessage(error) }, { status: 500 });
  }
}
