import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => {
      const entry: Record<string, any> = {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
      };
      if (item.href) {
        entry.item = absoluteUrl(item.href);
      }
      return entry;
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <nav aria-label="Breadcrumb" className={`text-sm text-slate-500 no-print ${className}`}>
        <ol className="flex items-center space-x-2 flex-wrap">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span aria-hidden="true" className="mx-2 text-slate-400">
                  /
                  </span>
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-slate-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "font-medium text-slate-800" : ""}
                  >
                   {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
