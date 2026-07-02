import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAdminOrderOverview } from "@/modules/order/order.service";

import { toClientErrorMessage } from "@/lib/apiError";
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const [{ totalRevenue, orderCount, recentOrders }, productCount, robotKitCount, lowStockProducts] =
      await Promise.all([
        getAdminOrderOverview(),
        prisma.product.count(),
        prisma.robotKit.count(),
        prisma.product.findMany({
          where: {
            stock: {
              lte: 20
            }
          },
          orderBy: { stock: "asc" },
          take: 5
        })
      ]);

    return NextResponse.json({
      ok: true,
      data: {
        stats: [
          { label: "Total Revenue", value: totalRevenue },
          { label: "Orders", value: orderCount },
          { label: "Products", value: productCount },
          { label: "Robot Kits", value: robotKitCount }
        ],
        recentOrders,
        inventoryAlerts: lowStockProducts
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to load admin overview.")
      },
      { status: 500 }
    );
  }
}
