import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrderByIdForUser, updateOrderByAdmin } from "@/modules/order/order.service";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const order = await getOrderByIdForUser({
      orderId: params.id,
      userId: session.user.id,
      role: session.user.role
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unexpected server error." },
      { status: error?.status || 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const order = await updateOrderByAdmin({
      orderId: params.id,
      body,
      actorName: session.user.name || session.user.email
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unexpected server error." },
      { status: error?.status || 500 }
    );
  }
}
