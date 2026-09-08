import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

function detectMimeType(buffer: Buffer, filePath: string): string {
  if (buffer.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // GIF: 47 49 46 38
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "image/gif";
    }
    // WEBP: RIFF....WEBP
    if (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }
    // AVIF: ....ftypavif
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 4, 12).includes("ftypavif")
    ) {
      return "image/avif";
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string[] }> }
) {
  try {
    const params = await context.params;
    const fileSegments = params?.file;
    if (!fileSegments || fileSegments.length === 0) {
      return new NextResponse("File not specified", { status: 400 });
    }

    // Sanitize to prevent path traversal
    const safeFilename = path.basename(fileSegments.join("/"));

    // Check candidate paths in priority order
    const candidates = [
      path.join(process.cwd(), "public", "images", "products", safeFilename),
      path.join(process.cwd(), "public", "images", ...fileSegments.map((s) => path.basename(s))),
      path.join(process.cwd(), "public", ...fileSegments.map((s) => path.basename(s))),
      path.join(process.cwd(), "public", "uploads", safeFilename),
    ];

    let targetPath: string | null = null;
    for (const c of candidates) {
      if (existsSync(c)) {
        targetPath = c;
        break;
      }
    }

    if (!targetPath) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const fileStat = await stat(targetPath);
    const buffer = await readFile(targetPath);
    const mimeType = detectMimeType(buffer, targetPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
