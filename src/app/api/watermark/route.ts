import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 404 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image metadata to calculate watermark dimensions
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imgWidth = imageMetadata.width || 1200;
    const imgHeight = imageMetadata.height || 800;

    // Calculate watermark dimensions (35% of image width)
    const watermarkWidth = Math.floor(imgWidth * 0.35);
    const watermarkHeight = Math.floor(watermarkWidth * 0.45); // Aspect ratio for two lines

    // Generate dynamic SVG watermark
    // Line 1: රථගාල
    // Line 2: www.rathagala.lk
    const svgWatermark = `
      <svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: white;
            font-family: sans-serif;
            text-anchor: middle;
            font-weight: bold;
          }
          .title { font-size: ${Math.floor(watermarkHeight * 0.45)}px; }
          .url { font-size: ${Math.floor(watermarkHeight * 0.25)}px; opacity: 0.8; }
        </style>
        <text x="50%" y="45%" class="watermark-text title">රථගාල</text>
        <text x="50%" y="85%" class="watermark-text url">www.rathagala.lk</text>
      </svg>
    `;

    // Composite watermark onto image (centered)
    const watermarkedImage = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgWatermark),
          gravity: "center",
          blend: "over",
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Return the watermarked image
    return new NextResponse(watermarkedImage, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error watermarking image:", error);
    return NextResponse.json(
      {
        error:
          (error as Error).message || "Error encountered while watermarking image",
      },
      { status: 500 }
    );
  }
}

