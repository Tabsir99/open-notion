import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeColor(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "")
}
