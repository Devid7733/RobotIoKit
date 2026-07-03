import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import { getCart } from "@/modules/cart/cart.service";
import { createOrderFromCart, listOrdersPaginated } from "@/modules/order/order.service";

import { toClientErrorMessage } from "@/lib/apiError";
export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const isAdmin = session.user.role === "ADMIN";

    const result = await listOrdersPaginated({
      userId: session.user.id,
      role: session.user.role,
      page,
      pageSize: isAdmin ? 500 : 20
    });

    return NextResponse.json({ ok: true, data: result.orders, meta: { page: result.page, totalPages: result.totalPages, total: result.total } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to load orders.")
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    let body = await request.json();

    const fullName = String(body.fullName || "").trim().slice(0, 100);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const address = String(body.address || "").trim().slice(0, 300);

    const missing = [];
    if (!fullName) missing.push("Full name");
    if (!phone) missing.push("Phone number");
    if (!address) missing.push("Address");
    if (!["pickup", "delivery"].includes(body.fulfillmentMethod)) missing.push("Fulfillment method");
    if (!["KHQR", "CASH_ON_DELIVERY"].includes(body.paymentMethod)) missing.push("Payment method");
    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, message: `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.` },
        { status: 400 }
      );
    }

    if (!/^\+?[\d\s\-().]{6,30}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "Please enter a valid phone number." }, { status: 400 });
    }

    body = { ...body, fullName, phone, address };

    const cart = await getCart({
      userId: session?.user?.id
    });

    const order = await createOrderFromCart({
      sessionUser: session?.user,
      body,
      cart
    });

    return NextResponse.json({ ok: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error?.status ? error.message : "Unable to create order. Please try again."
      },
      { status: error?.status || 500 }
    );
  }
}
