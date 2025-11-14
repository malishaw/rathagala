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

    // Load the watermark image
    const watermarkPath = join(process.cwd(), "public", "watermark.png");
    let watermarkBuffer: Buffer;
    
    try {
      watermarkBuffer = await readFile(watermarkPath);
    } catch (error) {
      // If watermark file doesn't exist, return original image
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": imageResponse.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata();
    const watermarkMetadata = await sharp(watermarkBuffer).metadata();

    // Calculate watermark size (30% of image width, maintaining aspect ratio)
    const watermarkWidth = Math.floor((imageMetadata.width || 1000) * 0.3);
    const watermarkHeight = Math.floor(
      (watermarkMetadata.height || 1) *
        (watermarkWidth / (watermarkMetadata.width || 1))
    );

    // Resize watermark (preserve transparency if PNG)
    const resizedWatermark = await sharp(watermarkBuffer)
      .resize(watermarkWidth, watermarkHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // Composite watermark onto image (centered)
    // The watermark PNG's transparency will be preserved
    const watermarkedImage = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWatermark,
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

