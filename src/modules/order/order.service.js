import {
  aggregateOrderRevenue,
  countOrders,
  countFilteredOrders,
  createCheckoutOrder,
  createOrderTimelineEntries,
  findOrderByCheckoutKey,
  findOrderById,
  findOrderForPayment,
  findOrdersForAnalytics,
  findOrderByUserId,
  findOrders,
  findTopProductOrderItemGroups,
  findRecentOrders,
  findTopRobotKitOrderItemGroups,
  restoreOrderInventory,
  runOrderTransaction,
  updateOrderDetails,
  updateOrderPayment
} from "@/modules/order/order.repository";
import { checkBakongTransactionByMd5 } from "@/lib/bakongClient";
import { getDeliveryFee } from "@/lib/deliveryFee";
import { generateDynamicKhqrPayment, getKhqrPaymentExpiresAt, renderKhqrPayloadImage, validateDynamicKhqrConfig } from "@/lib/khqr";
import { sendMail } from "@/lib/mail";
import { findProductsByIds } from "@/repositories/productRepository";
import { findRobotKitsByIds } from "@/repositories/robotKitRepository";

function createServiceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const ADMIN_PAYMENT_ACTION_STATUSES = new Set(["PAID", "FAILED"]);
const SYSTEM_PAYMENT_STATUSES = new Set(["UNPAID", "PENDING_VERIFICATION", "EXPIRED"]);

function isUnpaidKhqrPaymentExpired(order, now = new Date()) {
  const expiresAt = order?.payment?.paymentExpiresAt;

  if (
    !expiresAt ||
    order?.payment?.method !== "KHQR" ||
    order?.payment?.status !== "UNPAID"
  ) {
    return false;
  }

  return new Date(expiresAt).getTime() <= now.getTime();
}

function paymentAmountsMatch(expected, actual) {
  const expectedCents = Math.round(Number(expected || 0) * 100);
  const actualCents = Math.round(Number(actual || 0) * 100);
  return expectedCents === actualCents;
}

async function attachDynamicKhqrToOrder(order) {
  if (!order || order.paymentMethod !== "KHQR") {
    return order;
  }

  if (order.payment?.qrPayload && order.payment?.reference) {
    return order;
  }

  const expiresAt = order.payment?.paymentExpiresAt || getKhqrPaymentExpiresAt();
  const khqrPayment = await generateDynamicKhqrPayment({
    amount: order.total,
    orderNumber: order.orderNumber || order.id,
    expiresAt
  });

  await updateOrderPayment(order.id, {
    reference: khqrPayment.md5,
    qrPayload: khqrPayment.qrPayload,
    paymentExpiresAt: expiresAt
  });

  return findOrderById(order.id);
}

async function releaseInventoryForOrder(orderId, tx, { actorName = "System", reason = "Order inventory was released." } = {}) {
  const restored = await restoreOrderInventory(orderId, tx);

  if (!restored) {
    return false;
  }

  await createOrderTimelineEntries(
    orderId,
    [
      {
        type: "INVENTORY_RELEASED",
        message: reason,
        actorName
      }
    ],
    tx
  );

  return true;
}

function formatLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildOrderConfirmationEmail(order, email) {
  const itemRows = (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${item.name || "Item"}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">$${Number(item.price || 0).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const paymentLabel = order.paymentMethod === "KHQR" ? "KHQR (Bakong QR)" : "Cash on Delivery";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;line-height:1.6;">
      <h2 style="color:#2251f5;">Order Confirmed!</h2>
      <p>Hi ${order.customerName},</p>
      <p>Thank you for your order. Here's a summary:</p>
      <p><strong>Order #:</strong> ${order.orderNumber}<br/>
         <strong>Payment:</strong> ${paymentLabel}<br/>
         <strong>Delivery to:</strong> ${[order.address, order.city, order.province].filter(Boolean).join(", ")}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="text-align:right;">
        <strong>Subtotal:</strong> $${Number(order.subtotal || 0).toFixed(2)}<br/>
        <strong>Delivery:</strong> $${Number(order.deliveryFee || 0).toFixed(2)}<br/>
        <strong style="font-size:18px;">Total: $${Number(order.total || 0).toFixed(2)}</strong>
      </p>
      <p style="color:#64748b;font-size:13px;">
        ${order.paymentMethod === "KHQR" ? "Please complete your KHQR payment to confirm your order." : "Our team will contact you to arrange delivery."}
      </p>
      <p>Questions? Reply to this email or visit your <a href="${process.env.NEXTAUTH_URL || ""}/orders" style="color:#2251f5;">orders page</a>.</p>
      <p style="color:#64748b;font-size:12px;">RobotIoKit — Your robotics kit store.</p>
    </div>`;

  const text = `Order Confirmed — #${order.orderNumber}\n\nHi ${order.customerName},\n\nThank you for your order.\nTotal: $${Number(order.total || 0).toFixed(2)}\nPayment: ${paymentLabel}\n\nYou can view your order at: ${process.env.NEXTAUTH_URL || ""}/orders`;

  return {
    to: email,
    subject: `Order Confirmed — #${order.orderNumber}`,
    text,
    html
  };
}

async function sendOrderConfirmationEmail(order, email) {
  try {
    const message = buildOrderConfirmationEmail(order, email);
    await sendMail(message);
  } catch (error) {
    console.error("Failed to send order confirmation email", error);
  }
}

const ORDER_STATUS_EMAIL_CONFIG = {
  SHIPPED: {
    subject: "Your order has been shipped!",
    body: (orderNumber) => `Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you. You'll receive your items soon.`,
    text: (orderNumber) => `Great news! Your order #${orderNumber} has been shipped and is on its way to you.`
  },
  DELIVERED: {
    subject: "Your order has been delivered!",
    body: (orderNumber) => `Your order <strong>#${orderNumber}</strong> has been delivered. We hope you enjoy your items!`,
    text: (orderNumber) => `Your order #${orderNumber} has been delivered. We hope you enjoy your items!`
  },
  CANCELLED: {
    subject: "Your order has been cancelled",
    body: (orderNumber) => `Your order <strong>#${orderNumber}</strong> has been cancelled. If you have any questions, please reply to this email.`,
    text: (orderNumber) => `Your order #${orderNumber} has been cancelled. If you have questions, please contact us.`
  }
};

function buildOrderStatusEmail(order, newStatus) {
  const config = ORDER_STATUS_EMAIL_CONFIG[newStatus];
  if (!config) return null;

  const customerName = order.customerName || "Valued Customer";
  const orderNumber = order.orderNumber;
  const orderUrl = `${process.env.NEXTAUTH_URL || ""}/orders/${order.id}`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;line-height:1.6;">
      <h2 style="color:#2251f5;">${config.subject}</h2>
      <p>Hi ${customerName},</p>
      <p>${config.body(orderNumber)}</p>
      <p>
        <a href="${orderUrl}" style="display:inline-block;background:#2251f5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View Order
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">RobotIoKit — Your robotics kit store.</p>
    </div>`;

  const text = `${config.subject}\n\nHi ${customerName},\n\n${config.text(orderNumber)}\n\nView your order: ${orderUrl}`;

  return { subject: config.subject, html, text };
}

async function sendOrderStatusEmail(order, newStatus) {
  const email = order.user?.email;
  if (!email) return;

  try {
    const message = buildOrderStatusEmail(order, newStatus);
    if (!message) return;
    await sendMail({ to: email, ...message });
  } catch (error) {
    console.error("Failed to send order status email", error);
  }
}

function formatOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    province: order.province,
    city: order.city,
    address: order.address,
    note: order.note,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    payment: order.payment,
    user: order.user,
    timeline: (order.timeline || []).map((entry) => ({
      id: entry.id,
      type: entry.type,
      message: entry.message,
      actorName: entry.actorName,
      createdAt: entry.createdAt
    })),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.product?.name || item.robotKit?.name || "Unknown item",
      slug: item.product?.slug || item.robotKit?.slug || "",
      image: item.product?.imageUrl || item.product?.image || item.robotKit?.image || "",
      type: item.productId ? "product" : "robotKit",
      product: item.product,
      robotKit: item.robotKit
    }))
  };
}

export async function listOrders({ userId, role }) {
  const orders = await findOrders({
    userId,
    isAdmin: role === "ADMIN"
  });

  return orders;
}

export async function listOrdersPaginated({ userId, role, page = 1, pageSize = 20 }) {
  const isAdmin = role === "ADMIN";
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * pageSize;

  const [orders, total] = await Promise.all([
    findOrders({ userId, isAdmin, skip, take: pageSize }),
    countFilteredOrders({ userId, isAdmin })
  ]);

  return {
    orders,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getOrderByIdForUser({ orderId, userId, role }) {
  const order = await findOrderById(orderId);

  if (!order) {
    throw createServiceError("Order not found.", 404);
  }

  if (role !== "ADMIN" && order.userId !== userId) {
    throw createServiceError("Forbidden.", 403);
  }

  return order;
}

export async function getUserOrders(userId) {
  const orders = await findOrders({ userId });
  return orders.map(formatOrder);
}

export async function getUserOrdersPaginated(userId, page = 1, pageSize = 10) {
  const safePage = Math.max(1, Number(page) || 1);
  const skip = (safePage - 1) * pageSize;

  const [orders, total] = await Promise.all([
    findOrders({ userId, skip, take: pageSize }),
    countFilteredOrders({ userId, isAdmin: false })
  ]);

  return {
    orders: orders.map(formatOrder),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getUserOrderById(userId, orderId) {
  const order = await findOrderByUserId(userId, orderId);
  return order ? formatOrder(order) : null;
}

export async function getUserOrderOverview(userId) {
  const orders = await getUserOrders(userId);

  return {
    stats: {
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: orders.filter((order) => order.status === "PENDING" || order.status === "PREPARING").length
    },
    recentOrders: orders.slice(0, 5)
  };
}

export async function getAdminOrderOverview(limit = 5) {
  const [revenueAggregate, orderCount, recentOrders] = await Promise.all([
    aggregateOrderRevenue(),
    countOrders(),
    findRecentOrders(limit)
  ]);

  return {
    totalRevenue: revenueAggregate._sum.total || 0,
    orderCount,
    recentOrders
  };
}

export async function getAnalyticsOrderData(startDate, limit = 5) {
  const [orders, productGroups, robotKitGroups] = await Promise.all([
    findOrdersForAnalytics(startDate),
    findTopProductOrderItemGroups(startDate, limit),
    findTopRobotKitOrderItemGroups(startDate, limit)
  ]);

  const [products, robotKits] = await Promise.all([
    findProductsByIds(productGroups.map((item) => item.productId).filter(Boolean)),
    findRobotKitsByIds(robotKitGroups.map((item) => item.robotKitId).filter(Boolean))
  ]);

  return {
    orders,
    productGroups,
    robotKitGroups,
    products,
    robotKits
  };
}

export async function createOrderFromCart({ sessionUser, body, cart }) {
  const email = (sessionUser?.email || body.email || "").toLowerCase();

  if (!email) {
    throw createServiceError("Email is required for guest checkout.", 400);
  }

  if (!cart?.items?.length) {
    throw createServiceError("Cart is empty.", 400);
  }

  const checkoutKey = String(body.checkoutKey || "").trim() || null;

  if (checkoutKey) {
    const existingOrder = await findOrderByCheckoutKey(checkoutKey);

    if (existingOrder) {
      return attachDynamicKhqrToOrder(existingOrder);
    }
  }

  const fulfillmentMethod = body.fulfillmentMethod === "pickup" ? "pickup" : "delivery";
  const deliveryFee = fulfillmentMethod === "pickup" ? 0 : getDeliveryFee(body.province || "");
  const paymentMethod = body.paymentMethod || "KHQR";
  const paymentReference = paymentMethod === "KHQR" ? null : body.paymentReference || null;
  const paymentExpiresAt = paymentMethod === "KHQR" ? getKhqrPaymentExpiresAt() : null;

  if (paymentMethod === "KHQR") {
    validateDynamicKhqrConfig();
  }

  let order;

  try {
    order = await createCheckoutOrder({
      status: "PENDING",
      deliveryFee,
      customerName: body.fullName,
      customerPhone: body.phone,
      province: body.province,
      city: body.city,
      address: body.address,
      note: body.note,
      paymentMethod,
      paymentStatus: "UNPAID",
      paymentReference,
      qrPayload: null,
      paymentExpiresAt,
      email,
      cartId: cart.id,
      checkoutKey,
      timelineEntries: [
        {
          type: "ORDER_CREATED",
          message: "Order placed and awaiting admin review.",
          actorName: email
        }
      ]
    });
  } catch (error) {
    if (checkoutKey && error?.code === "P2002") {
      const existingOrder = await findOrderByCheckoutKey(checkoutKey);

      if (existingOrder) {
        return attachDynamicKhqrToOrder(existingOrder);
      }
    }

    throw error;
  }

  if (paymentMethod !== "KHQR") {
    await sendOrderConfirmationEmail(order, email);
    return order;
  }

  const finalOrder = await attachDynamicKhqrToOrder(order);
  await sendOrderConfirmationEmail(finalOrder, email);
  return finalOrder;
}

export async function getKhqrPaymentOrder(orderId) {
  const order = await findOrderForPayment(orderId);

  if (!order) {
    throw createServiceError("Order not found.", 404);
  }

  if (order.paymentMethod !== "KHQR" && order.payment?.method !== "KHQR") {
    throw createServiceError("This order is not a KHQR payment.", 400);
  }

  if (order.status === "CANCELLED") {
    throw createServiceError("This order has been cancelled.", 410);
  }

  return attachDynamicKhqrToOrder(order);
}

export async function renderKhqrPaymentImage(order) {
  const paymentOrder = await attachDynamicKhqrToOrder(order);
  const qrPayload = paymentOrder?.payment?.qrPayload;

  if (!qrPayload) {
    throw createServiceError("Dynamic KHQR payload is not available.", 500);
  }

  return {
    order: paymentOrder,
    qrImageDataUrl: await renderKhqrPayloadImage(qrPayload)
  };
}

export async function verifyKhqrPaymentWithBakong(orderId) {
  const paymentOrder = await getKhqrPaymentOrder(orderId);

  if (paymentOrder.payment?.status === "PAID") {
    return paymentOrder;
  }

  if (paymentOrder.payment?.status === "EXPIRED" || paymentOrder.payment?.status === "FAILED") {
    throw createServiceError("Payment expired. Please place your order again.", 410);
  }

  if (isUnpaidKhqrPaymentExpired(paymentOrder)) {
    await expireKhqrPayment(orderId, { actorName: "System" });
    throw createServiceError("Payment expired. Please place your order again.", 410);
  }

  if (!paymentOrder.payment?.reference) {
    await attachDynamicKhqrToOrder(paymentOrder);
  }

  const refreshedOrder = await getKhqrPaymentOrder(orderId);
  const response = await checkBakongTransactionByMd5(refreshedOrder.payment?.reference);

  if (response?.responseCode !== 0 || !response?.data) {
    throw createServiceError(response?.responseMessage || "Payment has not been received yet.", 402);
  }

  const paidAmount = response.data.amount;
  const paidCurrency = String(response.data.currency || "").toUpperCase();
  const expectedCurrency = String(process.env.KHQR_CURRENCY || "USD").toUpperCase();
  const paidToAccount = String(response.data.toAccountId || "").toLowerCase();
  const expectedAccount = String(process.env.KHQR_ACCOUNT_ID || "").toLowerCase();

  if (!paymentAmountsMatch(refreshedOrder.total, paidAmount) || paidCurrency !== expectedCurrency || paidToAccount !== expectedAccount) {
    throw createServiceError("Bakong transaction does not match this order.", 400);
  }

  return runOrderTransaction(async (tx) => {
    const existingOrder = await findOrderById(orderId, tx);

    if (!existingOrder) {
      throw createServiceError("Order not found.", 404);
    }

    if (existingOrder.payment?.status === "PAID") {
      return existingOrder;
    }

    if (existingOrder.payment?.status !== "UNPAID") {
      throw createServiceError(`Payment is already ${formatLabel(existingOrder.payment?.status)}.`, 400);
    }

    await updateOrderPayment(
      orderId,
      {
        status: "PAID",
        reference: response.data.hash || existingOrder.payment?.reference || null
      },
      tx
    );

    if (existingOrder.status === "PENDING") {
      await updateOrderDetails(orderId, { status: "PREPARING" }, tx);
    }

    await createOrderTimelineEntries(
      orderId,
      [
        {
          type: "KHQR_PAYMENT_CONFIRMED",
          message: "KHQR payment confirmed automatically through Bakong.",
          actorName: "Bakong"
        }
      ],
      tx
    );

    return findOrderById(orderId, tx);
  });
}

export async function expireKhqrPayment(orderId, { actorName = "System", tx } = {}) {
  const run = async (client) => {
    const existingOrder = await findOrderById(orderId, client);

    if (!existingOrder) {
      throw createServiceError("Order not found.", 404);
    }

    if (existingOrder.paymentMethod !== "KHQR" && existingOrder.payment?.method !== "KHQR") {
      throw createServiceError("This order is not a KHQR payment.", 400);
    }

    if (existingOrder.payment?.status === "EXPIRED" && existingOrder.status === "CANCELLED") {
      await releaseInventoryForOrder(orderId, client, {
        actorName,
        reason: "Item stock was restored after KHQR payment expiry."
      });
      return findOrderById(orderId, client);
    }

    if (existingOrder.payment?.status !== "UNPAID") {
      return existingOrder;
    }

    if (!isUnpaidKhqrPaymentExpired(existingOrder)) {
      return existingOrder;
    }

    await updateOrderPayment(
      orderId,
      {
        status: "EXPIRED"
      },
      client
    );

    await updateOrderDetails(
      orderId,
      {
        status: "CANCELLED"
      },
      client
    );

    await releaseInventoryForOrder(orderId, client, {
      actorName,
      reason: "Item stock was restored after KHQR payment expiry."
    });

    await createOrderTimelineEntries(
      orderId,
      [
        {
          type: "KHQR_PAYMENT_EXPIRED",
          message: "KHQR payment window expired before proof was submitted. Order was cancelled.",
          actorName
        }
      ],
      client
    );

    return findOrderById(orderId, client);
  };

  if (tx) {
    return run(tx);
  }

  return runOrderTransaction(run);
}

export async function cancelCustomerOrder({ orderId, userId, actorName }) {
  return runOrderTransaction(async (tx) => {
    const existingOrder = await findOrderById(orderId, tx);

    if (!existingOrder) {
      throw createServiceError("Order not found.", 404);
    }

    if (existingOrder.userId !== userId) {
      throw createServiceError("Forbidden.", 403);
    }

    if (existingOrder.status !== "PENDING") {
      throw createServiceError("Only pending orders can be cancelled.", 400);
    }

    await updateOrderDetails(orderId, { status: "CANCELLED" }, tx);

    await releaseInventoryForOrder(orderId, tx, {
      actorName,
      reason: "Item stock was restored after customer order cancellation."
    });

    await createOrderTimelineEntries(
      orderId,
      [
        {
          type: "ORDER_CANCELLED",
          message: "Order was cancelled by the customer.",
          actorName
        }
      ],
      tx
    );

    return findOrderById(orderId, tx);
  });
}

function buildTimelineEntries(existingOrder, body, actorName) {
  const timelineEntries = [];

  if (body.status && body.status !== existingOrder.status) {
    timelineEntries.push({
      type: "ORDER_STATUS_UPDATED",
      message: `Order status changed from ${formatLabel(existingOrder.status)} to ${formatLabel(body.status)}.`,
      actorName
    });
  }

  if (body.paymentStatus && body.paymentStatus !== existingOrder.payment?.status) {
    timelineEntries.push({
      type: "PAYMENT_STATUS_UPDATED",
      message: `Payment status changed from ${formatLabel(existingOrder.payment?.status || "UNPAID")} to ${formatLabel(body.paymentStatus)}.`,
      actorName
    });
  }

  if (body.paymentMethod && body.paymentMethod !== existingOrder.payment?.method) {
    timelineEntries.push({
      type: "PAYMENT_METHOD_UPDATED",
      message: `Payment method changed to ${formatLabel(body.paymentMethod)}.`,
      actorName
    });
  }

  if (body.paymentReference !== undefined && body.paymentReference !== (existingOrder.payment?.reference || "")) {
    timelineEntries.push({
      type: "PAYMENT_REFERENCE_UPDATED",
      message: body.paymentReference ? `Payment reference set to ${body.paymentReference}.` : "Payment reference cleared.",
      actorName
    });
  }

  if (body.note !== undefined && body.note !== (existingOrder.note || "")) {
    timelineEntries.push({
      type: "ADMIN_NOTE_UPDATED",
      message: body.note ? "Admin note updated." : "Admin note cleared.",
      actorName
    });
  }

  if (
    body.customerName !== existingOrder.customerName ||
    body.customerPhone !== existingOrder.customerPhone ||
    body.province !== existingOrder.province ||
    body.city !== existingOrder.city ||
    body.address !== existingOrder.address
  ) {
    timelineEntries.push({
      type: "DELIVERY_DETAILS_UPDATED",
      message: "Customer or delivery details were updated.",
      actorName
    });
  }

  return timelineEntries;
}

function validateAdminWorkflowUpdate(existingOrder, body) {
  const requestedOrderStatus = body.status;
  const requestedPaymentStatus = body.paymentStatus;
  const currentPaymentStatus = existingOrder.payment?.status || "UNPAID";

  if (requestedOrderStatus === "PENDING" && existingOrder.status !== "PENDING") {
    throw createServiceError("Pending is a system-controlled order status.", 400);
  }

  if (!requestedPaymentStatus || requestedPaymentStatus === currentPaymentStatus) {
    return;
  }

  if (SYSTEM_PAYMENT_STATUSES.has(requestedPaymentStatus)) {
    throw createServiceError(`${formatLabel(requestedPaymentStatus)} is controlled by the payment workflow.`, 400);
  }

  if (!ADMIN_PAYMENT_ACTION_STATUSES.has(requestedPaymentStatus)) {
    throw createServiceError("Unsupported payment action.", 400);
  }

  if (currentPaymentStatus !== "PENDING_VERIFICATION") {
    throw createServiceError("Payment can only be approved or rejected after customer proof is pending verification.", 400);
  }
}

export async function updateOrderByAdmin({ orderId, body, actorName }) {
  let prevStatus;
  let finalStatus;

  const updatedOrder = await runOrderTransaction(async (tx) => {
    const existingOrder = await findOrderById(orderId, tx);

    if (!existingOrder) {
      throw createServiceError("Order not found.", 404);
    }

    prevStatus = existingOrder.status;
    validateAdminWorkflowUpdate(existingOrder, body);

    const requestedStatus = body.status || existingOrder.status;
    const nextStatus =
      body.paymentStatus === "PAID" && existingOrder.status === "PENDING" && requestedStatus === existingOrder.status
        ? "PREPARING"
        : requestedStatus;
    finalStatus = nextStatus;

    await updateOrderDetails(
      orderId,
      {
        status: nextStatus,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        province: body.province,
        city: body.city,
        address: body.address,
        note: body.note
      },
      tx
    );

    if (body.paymentStatus || body.paymentMethod) {
      await updateOrderPayment(
        orderId,
        {
          status: body.paymentStatus || undefined,
          method: body.paymentMethod || undefined,
          reference: body.paymentReference !== undefined ? body.paymentReference || null : undefined
        },
        tx
      );
    }

    const shouldReleaseInventory = body.paymentStatus === "FAILED" || nextStatus === "CANCELLED";

    if (shouldReleaseInventory) {
      await releaseInventoryForOrder(orderId, tx, {
        actorName,
        reason:
          body.paymentStatus === "FAILED"
            ? "Item stock was restored after payment rejection."
            : "Item stock was restored after order cancellation."
      });
    }

    const timelineEntries = buildTimelineEntries(
      existingOrder,
      {
        ...body,
        status: nextStatus
      },
      actorName
    );

    if (timelineEntries.length > 0) {
      await createOrderTimelineEntries(orderId, timelineEntries, tx);
    }

    return findOrderById(orderId, tx);
  });

  if (finalStatus && finalStatus !== prevStatus && ORDER_STATUS_EMAIL_CONFIG[finalStatus]) {
    await sendOrderStatusEmail(updatedOrder, finalStatus);
  }

  return updatedOrder;
}
