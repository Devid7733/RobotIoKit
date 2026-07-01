import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import { cancelCustomerOrder } from "@/modules/order/order.service";

export async function POST(_request, { params }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    const routeParams = await params;
    const order = await cancelCustomerOrder({
      orderId: routeParams.id,
      userId: session.user.id,
      actorName: session.user.name || session.user.email || "Customer"
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to cancel order." },
      { status: error?.status || 500 }
    );
  }
}
