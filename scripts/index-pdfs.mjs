import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const pdfDirectory = path.join(projectRoot, "data", "Data PDF", "Accounts");
const outputPath = path.join(projectRoot, "data", "pdf-index.json");

function getPageCount(filePath) {
  const description = execFileSync("file", [filePath], {
    encoding: "utf8"
  });
  const match = description.trim().match(/,\s*(\d+)\s+pages?$/);
  return match ? Number(match[1]) : 0;
}

function getDocumentDate(filename) {
  const match = filename.match(/(\d{2})-(\d{2})-(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

const documents = readdirSync(pdfDirectory)
  .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
  .map((filename) => {
    const filePath = path.join(pdfDirectory, filename);
    const stats = statSync(filePath);

    return {
      filename,
      documentDate: getDocumentDate(filename),
      pages: getPageCount(filePath),
      size: stats.size,
      modifiedAt: stats.mtime.toISOString()
    };
  })
  .sort(
    (a, b) =>
      (b.documentDate ?? "").localeCompare(a.documentDate ?? "") ||
      b.filename.localeCompare(a.filename)
  );

writeFileSync(outputPath, `${JSON.stringify(documents, null, 2)}\n`);
console.log(
  `Indexed ${documents.length} PDFs and ${documents.reduce(
    (total, document) => total + document.pages,
    0
  )} pages.`
);
