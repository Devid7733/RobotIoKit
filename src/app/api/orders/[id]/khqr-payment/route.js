import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCustomerForbiddenResponse, isAdminSession } from "@/lib/roleAccess";
import { expireKhqrPayment, getKhqrPaymentOrder, verifyKhqrPaymentWithBakong } from "@/modules/order/order.service";
import { rateLimit } from "@/lib/rateLimit";
import { toClientErrorMessage } from "@/lib/apiError";

export const maxDuration = 20;

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (isAdminSession(session)) {
      return adminCustomerForbiddenResponse();
    }

    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!rateLimit(ip)) {
      return NextResponse.json({ ok: false, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const routeParams = await params;
    const existingOrder = await getKhqrPaymentOrder(routeParams.id);

    if (existingOrder.userId !== session.user.id) {
      return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
    }

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
        message: toClientErrorMessage(error, "Unable to verify KHQR payment.")
      },
      { status }
    );
  }
}
