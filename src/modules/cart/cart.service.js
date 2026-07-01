import { getOrCreateCartSessionId, getUserCartSessionId } from "@/lib/cartSession";
import {
  clearCart as clearCartItems,
  createCart,
  deleteCartById,
  deleteCartItem,
  findCartBySessionId,
  findCartByUserId,
  findProductById,
  findRobotKitById,
  findUserById,
  updateCart,
  updateCartItemQuantity as persistCartItemQuantity,
  upsertCartItem
} from "@/modules/cart/cart.repository";

function createServiceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeCartItem(item) {
  const entity = item.product || item.robotKit;
  const type = item.productId ? "product" : "robotKit";
  const category =
    type === "product"
      ? item.product?.category?.name || "Components"
      : "Robot Kits";

  return {
    id: entity?.id || item.id,
    cartItemId: item.id,
    type,
    productId: item.productId,
    robotKitId: item.robotKitId,
    slug: entity?.slug || "",
    name: entity?.name || "Unknown item",
    price: entity?.price || 0,
    image: entity?.imageUrl || entity?.image || "",
    category,
    qty: item.quantity
  };
}

function formatCart(cart) {
  const items = cart.items.map(normalizeCartItem);
  const itemCount = items.reduce((total, item) => total + item.qty, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    items,
    itemCount,
    subtotal
  };
}

async function resolveCartSessionId(userId) {
  return userId ? getUserCartSessionId(userId) : getOrCreateCartSessionId();
}

async function ensureCart({ userId } = {}) {
  // Verify the userId maps to a real User row before using it.
  // Guards against stale JWTs (deleted accounts) and synthetic ids like
  // "direct-admin" which have no DB record — Prisma enforces Cart.userId FK.
  const validUserId = userId ? (await findUserById(userId))?.id ?? null : null;

  if (process.env.NODE_ENV !== "production" && userId && !validUserId) {
    console.warn(`[cart] userId "${userId}" has no matching User row — falling back to guest cart`);
  }

  const sessionId = await resolveCartSessionId(validUserId);
  const existingCart = validUserId
    ? await findCartByUserId(validUserId)
    : await findCartBySessionId(sessionId);

  if (existingCart) {
    if (validUserId && existingCart.sessionId !== sessionId) {
      return updateCart(existingCart.id, { sessionId, userId: validUserId });
    }

    return existingCart;
  }

  return createCart(validUserId ? { sessionId, userId: validUserId } : { sessionId });
}

async function validateCartEntity({ productId, robotKitId, requestedQuantity = 1 }) {
  if (!productId && !robotKitId) {
    throw createServiceError("Product or robot kit is required.", 400);
  }

  if (productId) {
    const product = await findProductById(productId);

    if (!product) {
      throw createServiceError("Product not found.", 404);
    }

    if (Number(product.stock || 0) < requestedQuantity) {
      throw createServiceError(`Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${requestedQuantity}`, 400);
    }
  }

  if (robotKitId) {
    const robotKit = await findRobotKitById(robotKitId);

    if (!robotKit) {
      throw createServiceError("Robot kit not found.", 404);
    }

    if (Number(robotKit.stockQuantity || 0) < requestedQuantity) {
      throw createServiceError(`Insufficient stock for ${robotKit.name}. Available: ${robotKit.stockQuantity}, requested: ${requestedQuantity}`, 400);
    }
  }
}

function findExistingCartItem(cart, { productId, robotKitId }) {
  return (cart.items || []).find((item) => item.productId === productId && item.robotKitId === robotKitId);
}

export async function getCart({ userId } = {}) {
  const cart = await ensureCart({ userId });
  return formatCart(cart);
}

export async function addToCart({ userId, productId = null, robotKitId = null, quantity = 1 }) {
  const cart = await ensureCart({ userId });
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const existingItem = findExistingCartItem(cart, { productId, robotKitId });

  await validateCartEntity({
    productId,
    robotKitId,
    requestedQuantity: (existingItem?.quantity || 0) + safeQuantity
  });

  await upsertCartItem({
    cartId: cart.id,
    productId,
    robotKitId,
    quantity: safeQuantity
  });

  return getCart({ userId });
}

export async function updateCartItemQuantity({ userId, cartItemId, quantity }) {
  const cart = await ensureCart({ userId });
  const nextQuantity = Number(quantity) || 0;

  if (nextQuantity <= 0) {
    await deleteCartItem({
      cartId: cart.id,
      cartItemId
    });
  } else {
    const existingItem = (cart.items || []).find((item) => item.id === cartItemId);

    if (!existingItem) {
      throw createServiceError("Cart item not found.", 404);
    }

    await validateCartEntity({
      productId: existingItem.productId,
      robotKitId: existingItem.robotKitId,
      requestedQuantity: nextQuantity
    });

    await persistCartItemQuantity({
      cartId: cart.id,
      cartItemId,
      quantity: nextQuantity
    });
  }

  return getCart({ userId });
}

export async function removeCartItem({ userId, cartItemId }) {
  const cart = await ensureCart({ userId });

  await deleteCartItem({
    cartId: cart.id,
    cartItemId
  });

  return getCart({ userId });
}

export async function clearCart({ userId } = {}) {
  const cart = await ensureCart({ userId });
  await clearCartItems(cart.id);
  return getCart({ userId });
}

export async function mergeGuestCartIntoUserCart(userId, guestSessionId) {
  // Skip merge entirely if the userId has no DB record — attempting to create
  // or update a cart for a non-existent user would re-trigger the FK error.
  const validUser = userId ? await findUserById(userId) : null;

  if (!validUser) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[cart] mergeGuestCartIntoUserCart: userId "${userId}" not found — skipping merge`);
    }

    return null;
  }

  const userCart = await ensureCart({ userId: validUser.id });

  if (!guestSessionId) {
    return formatCart(userCart);
  }

  const guestCart = await findCartBySessionId(guestSessionId);

  if (!guestCart || guestCart.id === userCart.id || guestCart.items.length === 0) {
    return formatCart(userCart);
  }

  for (const item of guestCart.items) {
    await upsertCartItem({
      cartId: userCart.id,
      productId: item.productId,
      robotKitId: item.robotKitId,
      quantity: item.quantity
    });
  }

  await clearCartItems(guestCart.id);
  await deleteCartById(guestCart.id).catch(() => null);

  return getCart({ userId: validUser.id });
}
