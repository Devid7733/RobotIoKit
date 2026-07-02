import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { toClientErrorMessage } from "@/lib/apiError";
function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({ ok: true, data: categories });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to load categories.")
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug || slugify(body.name),
        description: body.description || null
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({ ok: true, data: category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to create category.")
      },
      { status: 500 }
    );
  }
}
