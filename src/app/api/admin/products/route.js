import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAdminProductsPaginated } from "@/services/productService";
import { toClientErrorMessage } from "@/lib/apiError";

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

    const result = await listAdminProductsPaginated({ search, page });

    return NextResponse.json({
      ok: true,
      data: result.items,
      meta: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: toClientErrorMessage(error, "Unable to load products.") },
      { status: error?.status || 500 }
    );
  }
}
