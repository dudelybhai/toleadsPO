"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileText, Files, Search } from "lucide-react";
import pdfIndex from "@/data/pdf-index.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type PdfDocument = {
  filename: string;
  documentDate: string | null;
  pages: number;
  size: number;
  modifiedAt: string;
};

const documents = pdfIndex as PdfDocument[];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataPage() {
  const [search, setSearch] = useState("");
  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? documents.filter((document) =>
          document.filename.toLowerCase().includes(query)
        )
      : documents;
  }, [search]);
  const totalPages = documents.reduce(
    (total, document) => total + document.pages,
    0
  );
  const totalSize = documents.reduce(
    (total, document) => total + document.size,
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="rounded-lg bg-secondary p-3">
              <Files className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">PDF files</div>
              <div className="font-mono text-2xl font-semibold">
                {documents.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Total pages</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {totalPages}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Storage</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {formatFileSize(totalSize)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Accounts PDF Data</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Original source scans from the Accounts folder.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search PDF filename"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Pages</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.filename}>
                  <TableCell className="min-w-80 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {document.filename}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {document.documentDate
                      ? formatDate(document.documentDate)
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {document.pages}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatFileSize(document.size)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/api/pdfs?file=${encodeURIComponent(
                        document.filename
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium shadow-sm hover:bg-secondary"
                    >
                      Open
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
