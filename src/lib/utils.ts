import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function toKebabCase(str: string) {
  return (
    str
      // Add hyphen before capital letters and convert to lowercase
      .replace(/([A-Z])/g, "-$1")
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove any non-alphanumeric characters (except hyphens)
      .replace(/[^\w\s-]/g, "")
      // Convert to lowercase
      .toLowerCase()
      // Remove leading hyphen if present
      .replace(/^-/, "")
      // Replace multiple consecutive hyphens with a single one
      .replace(/-+/g, "-")
  );
}
