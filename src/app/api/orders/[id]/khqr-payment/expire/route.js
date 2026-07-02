import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import { expireKhqrPayment, getKhqrPaymentOrder } from "@/modules/order/order.service";
import { toClientErrorMessage } from "@/lib/apiError";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const routeParams = await params;
    const existingOrder = await getKhqrPaymentOrder(routeParams.id);

    if (existingOrder.userId !== session.user.id) {
      return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
    }

    const order = await expireKhqrPayment(routeParams.id, { actorName: session.user.name || "Customer" });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to expire KHQR payment.") },
      { status: error?.status || 500 }
    );
  }
}
