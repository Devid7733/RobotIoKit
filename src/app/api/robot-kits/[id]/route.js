import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteRobotKit, getRobotKitById, updateRobotKit } from "@/services/robotKitService";

function getErrorMessage(error) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export async function GET(request, { params }) {
  try {
    const robotKit = await getRobotKitById(params.id);

    if (!robotKit) {
      return NextResponse.json({ ok: false, message: "Robot kit not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: robotKit });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const robotKit = await updateRobotKit(params.id, body);

    return NextResponse.json({ ok: true, data: robotKit });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: error?.status || 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    await deleteRobotKit(params.id);

    return NextResponse.json({ ok: true, message: "Robot kit deleted." });
  } catch (error) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
