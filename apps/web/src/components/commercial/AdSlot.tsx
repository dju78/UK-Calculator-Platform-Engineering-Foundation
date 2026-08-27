import React from "react";
import { isAdSlotAllowed, EXCLUDED_AD_CATEGORIES, EXCLUDED_AD_SLUGS } from "@/lib/commercial";

export { isAdSlotAllowed, EXCLUDED_AD_CATEGORIES, EXCLUDED_AD_SLUGS };

export interface AdSlotProps {
  slotId: string;
  category?: string;
  calculatorSlug?: string;
  className?: string;
}

/**
 * Safe Advertising Placement Component
 *
 * Requirements:
 * 1. Disabled by default (renders null unless NEXT_PUBLIC_ENABLE_ADS === 'true').
 * 2. Zero external third-party scripts loaded by default.
 * 3. Never renders in excluded clinical, reproductive, or high-vulnerability categories.
 * 4. Strictly labelled "Advertisement" with accessible semantics.
 * 5. Fixed reserved height to prevent Cumulative Layout Shift (CLS).
 */
export function AdSlot({
  slotId,
  category,
  calculatorSlug,
  className = "",
}: AdSlotProps) {
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";

  // 1. If ads are disabled globally, render absolutely nothing
  if (!adsEnabled) {
    return null;
  }

  // 2. Enforce category & slug exclusions
  if (!isAdSlotAllowed(category, calculatorSlug)) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      data-slot-id={slotId}
      className={`my-6 mx-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 no-print min-h-[90px] flex flex-col items-center justify-center ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Advertisement
      </span>
      <div className="text-slate-400 italic">
        Reserved Commercial Placement Space ({slotId})
      </div>
    </aside>
  );
}
