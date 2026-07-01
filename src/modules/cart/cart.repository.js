import prisma from "@/lib/prisma";

const cartItemInclude = {
  product: {
    include: {
      category: true
    }
  },
  robotKit: true
};

const cartInclude = {
  items: {
    include: cartItemInclude,
    orderBy: { createdAt: "asc" }
  }
};

export async function findCartByUserId(userId, includeItems = true) {
  return prisma.cart.findUnique({
    where: { userId },
    include: includeItems ? cartInclude : undefined
  });
}

export async function findCartBySessionId(sessionId, includeItems = true) {
  return prisma.cart.findUnique({
    where: { sessionId },
    include: includeItems ? cartInclude : undefined
  });
}

export async function createCart(data) {
  return prisma.cart.create({
    data,
    include: cartInclude
  });
}

export async function updateCart(id, data) {
  return prisma.cart.update({
    where: { id },
    data,
    include: cartInclude
  });
}

export async function findUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
}

export async function findProductById(productId) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stock: true }
  });
}

export async function findRobotKitById(robotKitId) {
  return prisma.robotKit.findUnique({
    where: { id: robotKitId },
    select: { id: true, name: true, stockQuantity: true }
  });
}

export async function upsertCartItem({ cartId, productId = null, robotKitId = null, quantity = 1 }) {
  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId,
      productId,
      robotKitId
    }
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity
      }
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId,
      quantity,
      productId,
      robotKitId
    }
  });
}

export async function updateCartItemQuantity({ cartId, cartItemId, quantity }) {
  return prisma.cartItem.updateMany({
    where: {
      id: cartItemId,
      cartId
    },
    data: {
      quantity
    }
  });
}

export async function deleteCartItem({ cartId, cartItemId }) {
  return prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartId
    }
  });
}

export async function clearCart(cartId) {
  return prisma.cartItem.deleteMany({
    where: { cartId }
  });
}

export async function deleteCartById(cartId) {
  return prisma.cart.delete({
    where: { id: cartId }
  });
}
