import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const pdfDirectory = path.join(
  process.cwd(),
  "data",
  "Data PDF",
  "Accounts"
);

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("file");

  if (!filename || filename !== path.basename(filename)) {
    return NextResponse.json({ error: "Invalid PDF filename." }, { status: 400 });
  }

  try {
    const file = await readFile(path.join(pdfDirectory, filename));

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
          filename
        )}`
      }
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "PDF source files are not included in this deployment. Use the local Accounts folder."
      },
      { status: 404 }
    );
  }
}
