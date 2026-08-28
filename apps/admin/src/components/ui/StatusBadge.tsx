import React from "react";

export type BadgeVariant =
  | "verified"
  | "current"
  | "approved"
  | "pass"
  | "implemented"
  | "low"
  | "review_due"
  | "medium"
  | "specified"
  | "warning"
  | "high"
  | "fail"
  | "planned"
  | "unknown"
  | "not_available"
  | "default";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

function resolveVariant(status: string): BadgeVariant {
  const s = status.toLowerCase().trim();
  if (s === "verified" || s === "current" || s === "approved" || s === "pass" || s === "active" || s === "integrated") {
    return "verified";
  }
  if (s === "implemented" || s === "low" || s === "released") {
    return "implemented";
  }
  if (s === "review due" || s === "review_due" || s === "medium" || s === "specified") {
    return "review_due";
  }
  if (s === "warning" || s === "high" || s === "fail" || s === "error" || s === "unconfigured") {
    return "warning";
  }
  if (s === "planned" || s === "planned_phase2") {
    return "planned";
  }
  return "unknown";
}

export function StatusBadge({ status, variant, size = "sm" }: StatusBadgeProps) {
  const v = variant || resolveVariant(status);

  let styles = "bg-slate-100 text-slate-700 border-slate-300";

  switch (v) {
    case "verified":
    case "current":
    case "approved":
    case "pass":
      styles = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
    case "implemented":
    case "low":
      styles = "bg-sky-50 text-sky-800 border-sky-300";
      break;
    case "review_due":
    case "medium":
    case "specified":
      styles = "bg-amber-50 text-amber-800 border-amber-300";
      break;
    case "warning":
    case "high":
    case "fail":
      styles = "bg-rose-50 text-rose-800 border-rose-300";
      break;
    case "planned":
      styles = "bg-indigo-50 text-indigo-800 border-indigo-300";
      break;
    case "not_available":
    case "unknown":
    default:
      styles = "bg-slate-100 text-slate-600 border-slate-300";
      break;
  }

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center font-medium border rounded ${sizeStyles} ${styles} whitespace-nowrap`}
    >
      {status}
    </span>
  );
}

