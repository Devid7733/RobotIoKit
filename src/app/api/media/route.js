import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { del, list, put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import path from "path";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  return null;
}

function createEmptyUsage() {
  return { inUse: false, products: [], robotKits: [] };
}

async function getUsageMap(urls) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  const usageMap = new Map(uniqueUrls.map((url) => [url, createEmptyUsage()]));

  if (!uniqueUrls.length) return usageMap;

  const [products, robotKits] = await Promise.all([
    prisma.product.findMany({
      where: { imageUrl: { in: uniqueUrls } },
      select: { id: true, name: true, imageUrl: true }
    }),
    prisma.robotKit.findMany({
      where: { image: { in: uniqueUrls } },
      select: { id: true, name: true, image: true }
    })
  ]);

  for (const product of products) {
    const usage = usageMap.get(product.imageUrl);
    if (!usage) continue;
    usage.products.push({ id: product.id, name: product.name });
    usage.inUse = true;
  }

  for (const robotKit of robotKits) {
    const usage = usageMap.get(robotKit.image);
    if (!usage) continue;
    usage.robotKits.push({ id: robotKit.id, name: robotKit.name });
    usage.inUse = true;
  }

  return usageMap;
}

export async function GET() {
  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const { blobs } = await list({ prefix: "uploads/" });
    const urls = blobs.map((b) => b.url);
    const usageMap = await getUsageMap(urls);

    const media = blobs.map((blob) => {
      const name = path.basename(blob.pathname);
      const usage = usageMap.get(blob.url) || createEmptyUsage();
      return { name, url: blob.url, ...usage };
    });

    media.sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({ ok: true, data: media });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load media." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Image file is required." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { ok: false, message: "Only JPG, PNG, WEBP, and GIF files are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Image must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name) || ".png";
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const buffer = await file.arrayBuffer();

    const blob = await put(`uploads/${fileName}`, buffer, { access: "public" });

    return NextResponse.json(
      { ok: true, data: { name: fileName, url: blob.url } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to upload image." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const force = searchParams.get("force") === "1";

    if (!url || !url.startsWith("https://") || !url.includes("blob.vercel-storage.com")) {
      return NextResponse.json({ ok: false, message: "Valid media URL is required." }, { status: 400 });
    }

    const usageMap = await getUsageMap([url]);
    const usage = usageMap.get(url) || createEmptyUsage();

    if (usage.inUse && !force) {
      return NextResponse.json(
        {
          ok: false,
          message: "This image is currently used by existing products or robot kits.",
          data: usage
        },
        { status: 409 }
      );
    }

    await del(url);

    return NextResponse.json({ ok: true, message: "Media deleted." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to delete media." },
      { status: 500 }
    );
  }
}
