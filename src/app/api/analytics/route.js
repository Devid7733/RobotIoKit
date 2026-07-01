import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsOrderData } from "@/modules/order/order.service";

const periodToMonths = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12
};

function formatMonthKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit"
  });
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStartDate(period) {
  const months = periodToMonths[period] || periodToMonths["6m"];
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
}

function getMonthKeys(period) {
  const months = periodToMonths[period] || periodToMonths["6m"];
  const now = new Date();
  const keys = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(formatMonthKey(date));
  }

  return keys;
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "6m";
    const startDate = getStartDate(period);

    const { orders, productGroups, robotKitGroups, products, robotKits } = await getAnalyticsOrderData(startDate);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const orderStatusMap = new Map();
    const paymentStatusMap = new Map();
    const paymentMethodMap = new Map();

    for (const order of orders) {
      orderStatusMap.set(order.status, (orderStatusMap.get(order.status) || 0) + 1);

      const paymentStatus = order.payment?.status || "UNPAID";
      paymentStatusMap.set(paymentStatus, (paymentStatusMap.get(paymentStatus) || 0) + 1);
      paymentMethodMap.set(order.paymentMethod, (paymentMethodMap.get(order.paymentMethod) || 0) + 1);
    }

    const monthKeys = getMonthKeys(period);
    const monthlyTrendMap = new Map(monthKeys.map((key) => [key, { month: key, revenue: 0, orders: 0 }]));

    for (const order of orders) {
      const key = formatMonthKey(order.createdAt);
      if (monthlyTrendMap.has(key)) {
        const current = monthlyTrendMap.get(key);
        current.orders += 1;
        current.revenue += Number(order.total || 0);
      }
    }

    const monthlyTrend = Array.from(monthlyTrendMap.values()).map((item) => ({
      ...item,
      label: formatMonthLabel(item.month)
    }));

    const peakMonth = monthlyTrend.reduce(
      (best, current) => (current.revenue > best.revenue ? current : best),
      monthlyTrend[0] || { label: "N/A", revenue: 0 }
    );

    return NextResponse.json({
      ok: true,
      data: {
        period,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          peakMonth: peakMonth.label || "N/A",
          deliveredOrders: orderStatusMap.get("COMPLETED") || 0,
          pendingPayments: paymentStatusMap.get("UNPAID") || 0
        },
        orderStatusBreakdown: Array.from(orderStatusMap.entries()).map(([status, count]) => ({
          status,
          label: formatLabel(status),
          count
        })),
        paymentStatusBreakdown: Array.from(paymentStatusMap.entries()).map(([status, count]) => ({
          status,
          label: formatLabel(status),
          count
        })),
        paymentMethodBreakdown: Array.from(paymentMethodMap.entries()).map(([method, count]) => ({
          method,
          label: formatLabel(method),
          count
        })),
        monthlyTrend,
        bestSellingProducts: productGroups.map((group) => ({
          id: group.productId,
          name: products.find((product) => product.id === group.productId)?.name || "Unknown product",
          quantity: group._sum.quantity || 0
        })),
        bestSellingRobotKits: robotKitGroups.map((group) => ({
          id: group.robotKitId,
          name: robotKits.find((kit) => kit.id === group.robotKitId)?.name || "Unknown robot kit",
          quantity: group._sum.quantity || 0
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to load analytics."
      },
      { status: 500 }
    );
  }
}
