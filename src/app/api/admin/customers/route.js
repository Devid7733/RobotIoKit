import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw Object.assign(new Error("Unauthorized."), { status: 401 });
  }
  return session;
}

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where = {
      role: "CUSTOMER",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          province: true,
          city: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      ok: true,
      data: customers,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load customers." },
      { status: error?.status || 500 }
    );
  }
}
