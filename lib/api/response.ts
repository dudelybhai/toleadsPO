import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/auth";

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request.", details: error.flatten() },
      { status: 422 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A record with the same unique values already exists." },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
  }

  console.error(error);
  return NextResponse.json(
    { error: "An unexpected server error occurred." },
    { status: 500 }
  );
}

export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "object" &&
      item !== null &&
      item.constructor?.name === "Decimal"
        ? Number(item)
        : item
    )
  ) as T;
}
