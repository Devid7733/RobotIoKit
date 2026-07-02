import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRobotKit, listStorefrontRobotKits } from "@/services/robotKitService";

import { toClientErrorMessage } from "@/lib/apiError";
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const robotKits = await listStorefrontRobotKits(undefined, search);

    return NextResponse.json({ ok: true, data: robotKits });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to load robot kits.")
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
    const robotKit = await createRobotKit(body);

    return NextResponse.json({ ok: true, data: robotKit }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to create robot kit.")
      },
      { status: error?.status || 500 }
    );
  }
}
