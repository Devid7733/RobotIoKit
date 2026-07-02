import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccountProfile, updateAccountAvatar } from "@/modules/account/account.service";

import { toClientErrorMessage } from "@/lib/apiError";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

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

    const previousProfile = await getAccountProfile(session.user.id);

    const extension = allowedImageTypes.get(file.type);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const bytes = await file.arrayBuffer();

    const blob = await put(`avatars/${fileName}`, Buffer.from(bytes), { access: "public" });
    const avatarUrl = blob.url;

    const user = await updateAccountAvatar(session.user.id, avatarUrl);

    const previousAvatarUrl = previousProfile?.avatarUrl;
    if (previousAvatarUrl && previousAvatarUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(previousAvatarUrl);
      } catch (cleanupError) {
        console.warn("Unable to delete previous avatar blob.", cleanupError);
      }
    }

    return NextResponse.json({ ok: true, data: { avatarUrl, user } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: toClientErrorMessage(error, "Unable to upload avatar.")
      },
      { status: error?.status || 500 }
    );
  }
}
