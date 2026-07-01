import { getAccountProfile } from "@/modules/account/account.service";
import { getUserOrderOverview } from "@/modules/order/order.service";

export async function getAccountOverview(userId) {
  const [user, orderOverview] = await Promise.all([
    getAccountProfile(userId),
    getUserOrderOverview(userId)
  ]);

  if (!user) {
    return null;
  }

  return {
    user,
    stats: orderOverview.stats,
    recentOrders: orderOverview.recentOrders
  };
}
