import prisma from "@/lib/prisma";

const orderInclude = {
  // Only fields actually read downstream (formatOrder, admin/customer order UIs) —
  // full User rows previously leaked password/OTP hashes to the browser via this include.
  user: { select: { email: true } },
  payment: true,
  timeline: {
    orderBy: { createdAt: "desc" }
  },
  items: {
    include: {
      product: { select: { name: true, slug: true, imageUrl: true } },
      robotKit: { select: { name: true, slug: true, image: true } }
    }
  }
};

function getClient(tx) {
  return tx || prisma;
}

async function generateOrderNumber(tx) {
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const nextYearStart = new Date(year + 1, 0, 1);
  const currentYearOrderCount = await tx.order.count({
    where: {
      createdAt: {
        gte: yearStart,
        lt: nextYearStart
      }
    }
  });

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const sequence = currentYearOrderCount + attempt;
    const candidate = `ORD-${year}-${String(sequence).padStart(4, "0")}`;
    const existingOrder = await tx.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true }
    });

    if (!existingOrder) {
      return candidate;
    }
  }

  const error = new Error("Unable to generate a unique order number.");
  error.status = 500;
  throw error;
}

export async function findOrders({ userId, isAdmin = false, skip, take }) {
  return prisma.order.findMany({
    where: isAdmin ? undefined : { userId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
    ...(skip != null ? { skip } : {}),
    ...(take != null ? { take } : {})
  });
}

export async function countFilteredOrders({ userId, isAdmin = false } = {}) {
  return prisma.order.count({
    where: isAdmin || !userId ? undefined : { userId }
  });
}

export async function findOrderForPayment(orderId) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      user: true
    }
  });
}

export async function aggregateOrderRevenue() {
  return prisma.order.aggregate({
    _sum: {
      total: true
    }
  });
}

export async function countOrders() {
  return prisma.order.count();
}

export async function findRecentOrders(limit = 5) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      province: true,
      total: true,
      status: true,
      payment: {
        select: {
          status: true
        }
      }
    }
  });
}

export async function findOrdersForAnalytics(startDate) {
  return prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate
      }
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      payment: {
        select: {
          status: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function findTopProductOrderItemGroups(startDate, limit = 5) {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: {
        not: null
      },
      order: {
        createdAt: {
          gte: startDate
        }
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: "desc"
      }
    },
    take: limit
  });
}

export async function findTopRobotKitOrderItemGroups(startDate, limit = 5) {
  return prisma.orderItem.groupBy({
    by: ["robotKitId"],
    where: {
      robotKitId: {
        not: null
      },
      order: {
        createdAt: {
          gte: startDate
        }
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: "desc"
      }
    },
    take: limit
  });
}

export async function findOrderById(orderId, tx) {
  return getClient(tx).order.findUnique({
    where: { id: orderId },
    include: orderInclude
  });
}

export async function findOrderByUserId(userId, orderId) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    },
    include: orderInclude
  });
}

export async function findOrderByCheckoutKey(checkoutKey) {
  if (!checkoutKey) {
    return null;
  }

  return prisma.order.findUnique({
    where: { checkoutKey },
    include: orderInclude
  });
}

export async function createCheckoutOrder(data) {
  return prisma.$transaction(async (tx) => {
    if (data.checkoutKey) {
      const existingOrder = await tx.order.findUnique({
        where: { checkoutKey: data.checkoutKey },
        include: orderInclude
      });

      if (existingOrder) {
        return existingOrder;
      }
    }

    const cart = await tx.cart.findUnique({
      where: { id: data.cartId },
      include: {
        items: {
          include: {
            product: true,
            robotKit: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!cart?.items?.length) {
      const error = new Error("Cart is empty.");
      error.status = 400;
      throw error;
    }

    const orderItems = [];

    for (const item of cart.items) {
      if (item.productId) {
        if (!item.product) {
          const error = new Error("Product not found.");
          error.status = 400;
          throw error;
        }

        if (item.product.stock < item.quantity) {
          const error = new Error(
            `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, requested: ${item.quantity}`
          );
          error.status = 400;
          throw error;
        }

        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity
            }
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        if (stockUpdate.count !== 1) {
          const error = new Error(
            `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, requested: ${item.quantity}`
          );
          error.status = 400;
          throw error;
        }
      }

      if (item.robotKitId) {
        if (!item.robotKit) {
          const error = new Error("Robot kit not found.");
          error.status = 400;
          throw error;
        }

        if (item.robotKit.stockQuantity < item.quantity) {
          const error = new Error(
            `Insufficient stock for ${item.robotKit.name}. Available: ${item.robotKit.stockQuantity}, requested: ${item.quantity}`
          );
          error.status = 400;
          throw error;
        }

        const stockUpdate = await tx.robotKit.updateMany({
          where: {
            id: item.robotKitId,
            stockQuantity: {
              gte: item.quantity
            }
          },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });

        if (stockUpdate.count !== 1) {
          const error = new Error(
            `Insufficient stock for ${item.robotKit.name}. Available: ${item.robotKit.stockQuantity}, requested: ${item.quantity}`
          );
          error.status = 400;
          throw error;
        }
      }

      const entity = item.product || item.robotKit;

      if (!entity) {
        const error = new Error("Cart item is no longer available.");
        error.status = 400;
        throw error;
      }

      orderItems.push({
        quantity: item.quantity,
        price: entity.price,
        productId: item.productId || null,
        robotKitId: item.robotKitId || null
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + data.deliveryFee;

    const user = await tx.user.upsert({
      where: { email: data.email },
      update: {
        name: data.customerName,
        phone: data.customerPhone,
        province: data.province,
        city: data.city,
        address: data.address
      },
      create: {
        name: data.customerName,
        email: data.email,
        phone: data.customerPhone,
        province: data.province,
        city: data.city,
        address: data.address
      }
    });

    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(tx),
        status: data.status,
        subtotal,
        deliveryFee: data.deliveryFee,
        total,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        province: data.province,
        city: data.city,
        address: data.address,
        note: data.note,
        paymentMethod: data.paymentMethod,
        checkoutKey: data.checkoutKey || null,
        inventoryReservedAt: new Date(),
        userId: user.id,
        items: {
          create: orderItems.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId || null,
            robotKitId: item.robotKitId || null
          }))
        },
        payment: {
          create: {
            method: data.paymentMethod,
            status: data.paymentStatus,
            reference: data.paymentReference,
            qrPayload: data.qrPayload,
            paymentExpiresAt: data.paymentExpiresAt
          }
        },
        timeline: {
          create: data.timelineEntries.map((entry) => ({
            type: entry.type,
            message: entry.message,
            actorName: entry.actorName
          }))
        }
      },
      include: orderInclude
    });

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return tx.order.findUnique({
      where: { id: order.id },
      include: orderInclude
    });
  });
}

export async function updateOrderDetails(orderId, data, tx) {
  return getClient(tx).order.update({
    where: { id: orderId },
    data
  });
}

export async function updateOrderPayment(orderId, data, tx) {
  return getClient(tx).payment.updateMany({
    where: { orderId },
    data
  });
}

export async function restoreOrderInventory(orderId, tx) {
  const client = getClient(tx);
  const release = await client.order.updateMany({
    where: {
      id: orderId,
      inventoryReservedAt: {
        not: null
      },
      inventoryReleasedAt: null
    },
    data: {
      inventoryReleasedAt: new Date()
    }
  });

  if (release.count !== 1) {
    return false;
  }

  const productItems = await client.orderItem.findMany({
    where: {
      orderId,
      productId: {
        not: null
      }
    },
    select: {
      productId: true,
      quantity: true
    }
  });

  for (const item of productItems) {
    await client.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity
        }
      }
    });
  }

  const robotKitItems = await client.orderItem.findMany({
    where: {
      orderId,
      robotKitId: {
        not: null
      }
    },
    select: {
      robotKitId: true,
      quantity: true
    }
  });

  for (const item of robotKitItems) {
    await client.robotKit.update({
      where: { id: item.robotKitId },
      data: {
        stockQuantity: {
          increment: item.quantity
        }
      }
    });
  }

  return true;
}

export async function createOrderTimelineEntries(orderId, entries, tx) {
  return getClient(tx).orderTimeline.createMany({
    data: entries.map((entry) => ({
      ...entry,
      orderId
    }))
  });
}

export async function runOrderTransaction(callback) {
  return prisma.$transaction((tx) => callback(tx));
}
