import { NextRequest } from "next/server";
import { listQuerySchema } from "@/lib/api/validation";

export function parseListQuery(request: NextRequest) {
  return listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
}

export function dateWhere(from?: string, to?: string) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
    ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {})
  };
}
