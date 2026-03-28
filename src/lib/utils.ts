import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getPetUrl(qrId: string) {
  return `${getAppUrl()}/pet/${qrId}`;
}

export function formatPhone(phone: string) {
  return phone.startsWith("+") ? phone : `+51${phone.replace(/\D/g, "")}`;
}

export function getWhatsAppUrl(phone: string, message: string) {
  const clean = formatPhone(phone).replace("+", "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
