import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountProfile, updateAccountProfile } from "@/modules/account/account.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await getAccountProfile(session.user.id);

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const user = await updateAccountProfile(session.user.id, body);

    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to update profile.",
        fields: error?.fields || {}
      },
      { status: error?.status || 500 }
    );
  }
}
