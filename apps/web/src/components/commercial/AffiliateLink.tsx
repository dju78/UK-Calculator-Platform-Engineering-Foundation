import React from "react";

export interface AffiliateLinkProps {
  href: string;
  partnerName: string;
  children: React.ReactNode;
  className?: string;
  disclosureText?: string;
}

/**
 * Safe Commercial / Affiliate Link Component
 *
 * Requirements:
 * 1. Enforces rel="sponsored nofollow noopener".
 * 2. Provides clear commercial disclosure.
 * 3. Supports global disablement / kill-switch via NEXT_PUBLIC_ENABLE_AFFILIATES.
 * 4. Never fabricated with fake offers, fake rates, or deceptive endorsements.
 */
export function AffiliateLink({
  href,
  partnerName,
  children,
  className = "",
  disclosureText,
}: AffiliateLinkProps) {
  const affiliatesEnabled = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === "true";

  // If affiliate features are disabled or unconfigured, render plain unmonetized children
  if (!affiliatesEnabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className="inline-flex flex-col sm:inline-flex sm:flex-row items-baseline gap-1">
      <a
        href={href}
        target="_blank"
        rel="sponsored nofollow noopener"
        aria-label={`${typeof children === "string" ? children : partnerName} (Sponsored link to ${partnerName})`}
        className={`text-blue-600 underline hover:text-blue-800 ${className}`}
      >
        {children}
      </a>
      <span className="text-[10px] uppercase font-semibold text-slate-400 border border-slate-300 rounded px-1 py-0.5 ml-1">
        {disclosureText || "Sponsored"}
      </span>
    </span>
  );
}
