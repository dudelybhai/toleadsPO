import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}
