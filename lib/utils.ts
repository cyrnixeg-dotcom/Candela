// Utility functions for Candela

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CND-${timestamp}-${random}`;
}

export function formatPrice(price: number, currency = "EGP"): string {
  return `${price.toLocaleString("ar-EG")} ${currency}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-200",
    CONFIRMED: "text-blue-600 bg-blue-50 border-blue-200",
    PREPARING: "text-purple-600 bg-purple-50 border-purple-200",
    OUT_FOR_DELIVERY: "text-orange-600 bg-orange-50 border-orange-200",
    DELIVERED: "text-green-600 bg-green-50 border-green-200",
    CANCELLED: "text-red-600 bg-red-50 border-red-200",
  };
  return colors[status] || "text-gray-600 bg-gray-50 border-gray-200";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending Confirmation",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing Your Order",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

export const GOVERNORATES = [
  "Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Sharm El Sheikh",
  "Hurghada", "Port Said", "Suez", "Mansoura", "Tanta", "Zagazig",
  "Ismailia", "Faiyum", "Beni Suef", "Asyut", "Sohag", "Qena",
  "Minya", "Damietta", "Kafr El Sheikh", "Gharbia", "Monufia",
  "Qalyubia", "Beheira", "Sharqia", "South Sinai", "North Sinai",
  "Red Sea", "New Valley", "Matruh",
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}
