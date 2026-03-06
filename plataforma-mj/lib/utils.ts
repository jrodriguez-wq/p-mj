import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Currency without trailing .00 when whole (e.g. $5,000 not $5,000.00) */
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "$0";
  const hasCents = n % 1 !== 0;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
