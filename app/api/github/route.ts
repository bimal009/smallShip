import { buildImage } from "@/core/build";
import { cloneRepo } from "@/core/clone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId, fullname } = body;

    if (!appId || !fullname) {
      return NextResponse.json(
        {
          success: false,
          message: "appId and fullname are required",
        },
        { status: 400 }
      );
    }

    const buildPath = await cloneRepo(appId, fullname, false);

    if (!buildPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to clone repository",
        },
        { status: 500 }
      );
    }

    const imageTag = await buildImage(
      appId,
      buildPath,
      (line) => console.log(`[BUILD] ${line}`)
    );

    return NextResponse.json(
      {
        success: true,
        message: "Application built successfully",
        data: {
          appId,
          imageTag,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Build failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Application build failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}