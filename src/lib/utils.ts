import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRupiahInput = (rawVal: string | number): string => {
  if (rawVal === undefined || rawVal === null || rawVal === "") return "";
  const clean = rawVal.toString().replace(/\D/g, "");
  if (!clean) return "";
  const num = parseInt(clean, 10);
  return "Rp " + num.toLocaleString("id-ID");
};

export const parseRupiahValue = (formattedVal: string): string => {
  return formattedVal.replace(/\D/g, "");
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const formatDateTime = (timestamp: any, fallbackDate: string) => {
  if (timestamp && timestamp.toDate) {
    const date = timestamp.toDate();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mins}:${ss}`;
  }
  return fallbackDate;
};
