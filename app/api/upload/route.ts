import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  const formData = await request.formData();

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "File is required" },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const key = `${crypto.randomUUID()}-${file.name}`;

  await uploadFile(
    key,
    buffer,
    file.type || "application/octet-stream",
  );

  return NextResponse.json({
    success: true,
    key,
  });
}