import { NextResponse } from "next/server";
import { expireKhqrPayment } from "@/modules/order/order.service";

export async function POST(request, { params }) {
  try {
    const routeParams = await params;
    const order = await expireKhqrPayment(routeParams.id, { actorName: "System" });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to expire KHQR payment." },
      { status: error?.status || 500 }
    );
  }
}
