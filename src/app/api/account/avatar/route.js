import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateAccountAvatar } from "@/modules/account/account.service";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const avatarUploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

async function ensureAvatarUploadsDir() {
  await mkdir(avatarUploadsDir, { recursive: true });
}

function isUploadFile(value) {
  return value && typeof value === "object" && typeof value.arrayBuffer === "function";
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!isUploadFile(file)) {
      return NextResponse.json({ ok: false, message: "Avatar image is required." }, { status: 400 });
    }

    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        { ok: false, message: "Only JPG, PNG, and WEBP avatar images are supported." },
        { status: 400 }
      );
    }

    if (file.size >= MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Avatar image must be smaller than 2MB." },
        { status: 400 }
      );
    }

    await ensureAvatarUploadsDir();

    const extension = allowedImageTypes.get(file.type);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const bytes = await file.arrayBuffer();
    const avatarUrl = `/uploads/avatars/${fileName}`;

    await writeFile(path.join(avatarUploadsDir, fileName), Buffer.from(bytes));

    const user = await updateAccountAvatar(session.user.id, avatarUrl);

    return NextResponse.json({ ok: true, data: { avatarUrl, user } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to upload avatar."
      },
      { status: error?.status || 500 }
    );
  }
}
