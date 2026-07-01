import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import { expireKhqrPayment, getKhqrPaymentOrder, verifyKhqrPaymentWithBakong } from "@/modules/order/order.service";

export async function PATCH(_request, { params }) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    const routeParams = await params;
    const existingOrder = await getKhqrPaymentOrder(routeParams.id);

    if (existingOrder.payment?.status === "PAID") {
      return NextResponse.json({ ok: true, data: existingOrder });
    }

    if (existingOrder.payment?.status === "EXPIRED" || existingOrder.payment?.status === "FAILED") {
      return NextResponse.json(
        { ok: false, message: "Payment expired. Please place your order again." },
        { status: 410 }
      );
    }

    if (
      existingOrder.payment?.status === "UNPAID" &&
      existingOrder.payment?.paymentExpiresAt &&
      new Date(existingOrder.payment.paymentExpiresAt).getTime() <= Date.now()
    ) {
      await expireKhqrPayment(routeParams.id, { actorName: "System" });
      return NextResponse.json(
        { ok: false, message: "Payment expired. Please place your order again." },
        { status: 410 }
      );
    }

    const order = await verifyKhqrPaymentWithBakong(routeParams.id);

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    const status = error?.status || 500;

    return NextResponse.json(
      {
        ok: false,
        paid: false,
        message: error instanceof Error ? error.message : "Unable to verify KHQR payment."
      },
      { status }
    );
  }
}
