export type CategoryTone = {
  badge: string;
  filterUnselected: string;
};

export const CATEGORY_TONES: Record<string, CategoryTone> = {
  "uk tax & salary": {
    badge: "bg-blue-50 text-blue-950 border border-blue-200/90",
    filterUnselected: "bg-blue-50/80 text-blue-950 border border-blue-200/80 hover:bg-blue-100/90",
  },
  "mortgages & property": {
    badge: "bg-teal-50 text-teal-950 border border-teal-200/90",
    filterUnselected: "bg-teal-50/80 text-teal-950 border border-teal-200/80 hover:bg-teal-100/90",
  },
  "investing & wealth": {
    badge: "bg-emerald-50 text-emerald-950 border border-emerald-200/90",
    filterUnselected: "bg-emerald-50/80 text-emerald-950 border border-emerald-200/80 hover:bg-emerald-100/90",
  },
  "pensions & retirement": {
    badge: "bg-amber-50 text-amber-950 border border-amber-200/90",
    filterUnselected: "bg-amber-50/80 text-amber-950 border border-amber-200/80 hover:bg-amber-100/90",
  },
  "health & fitness": {
    badge: "bg-rose-50 text-rose-950 border border-rose-200/90",
    filterUnselected: "bg-rose-50/80 text-rose-950 border border-rose-200/80 hover:bg-rose-100/90",
  },
  "automotive & travel": {
    badge: "bg-cyan-50 text-cyan-950 border border-cyan-200/90",
    filterUnselected: "bg-cyan-50/80 text-cyan-950 border border-cyan-200/80 hover:bg-cyan-100/90",
  },
  "business & commercial": {
    badge: "bg-violet-50 text-violet-950 border border-violet-200/90",
    filterUnselected: "bg-violet-50/80 text-violet-950 border border-violet-200/80 hover:bg-violet-100/90",
  },
  "statistics & data": {
    badge: "bg-indigo-50 text-indigo-950 border border-indigo-200/90",
    filterUnselected: "bg-indigo-50/80 text-indigo-950 border border-indigo-200/80 hover:bg-indigo-100/90",
  },
  "technology & digital": {
    badge: "bg-sky-50 text-sky-950 border border-sky-200/90",
    filterUnselected: "bg-sky-50/80 text-sky-950 border border-sky-200/80 hover:bg-sky-100/90",
  },
  "education": {
    badge: "bg-yellow-50 text-yellow-950 border border-yellow-200/90",
    filterUnselected: "bg-yellow-50/80 text-yellow-950 border border-yellow-200/80 hover:bg-yellow-100/90",
  },
  "date & time": {
    badge: "bg-purple-50 text-purple-950 border border-purple-200/90",
    filterUnselected: "bg-purple-50/80 text-purple-950 border border-purple-200/80 hover:bg-purple-100/90",
  },
  "conversions": {
    badge: "bg-slate-100 text-slate-800 border border-slate-300/80",
    filterUnselected: "bg-slate-100 text-slate-800 border border-slate-200/90 hover:bg-slate-200/80 hover:text-slate-950",
  },
  "everyday & lifestyle": {
    badge: "bg-lime-50 text-lime-950 border border-lime-200/90",
    filterUnselected: "bg-lime-50/80 text-lime-950 border border-lime-200/80 hover:bg-lime-100/90",
  },
  "finance & debt": {
    badge: "bg-blue-50 text-blue-950 border border-blue-200/90",
    filterUnselected: "bg-blue-50/80 text-blue-950 border border-blue-200/80 hover:bg-blue-100/90",
  },
  "home & construction": {
    badge: "bg-orange-50 text-orange-950 border border-orange-200/90",
    filterUnselected: "bg-orange-50/80 text-orange-950 border border-orange-200/80 hover:bg-orange-100/90",
  },
  "geometry": {
    badge: "bg-violet-50 text-violet-950 border border-violet-200/90",
    filterUnselected: "bg-violet-50/80 text-violet-950 border border-violet-200/80 hover:bg-violet-100/90",
  },
  "maths & algebra": {
    badge: "bg-indigo-50 text-indigo-950 border border-indigo-200/90",
    filterUnselected: "bg-indigo-50/80 text-indigo-950 border border-indigo-200/80 hover:bg-indigo-100/90",
  },
  "science & engineering": {
    badge: "bg-cyan-50 text-cyan-950 border border-cyan-200/90",
    filterUnselected: "bg-cyan-50/80 text-cyan-950 border border-cyan-200/80 hover:bg-cyan-100/90",
  },
  "isa & tax wrappers": {
    badge: "bg-emerald-50 text-emerald-950 border border-emerald-200/90",
    filterUnselected: "bg-emerald-50/80 text-emerald-950 border border-emerald-200/80 hover:bg-emerald-100/90",
  },
};

const DEFAULT_CATEGORY_TONE: CategoryTone = {
  badge: "bg-slate-100 text-slate-700 border border-slate-200/80",
  filterUnselected: "bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-950",
};

export function getCategoryTone(category?: string): CategoryTone {
  if (!category) return DEFAULT_CATEGORY_TONE;
  const key = category.trim().toLowerCase();
  return CATEGORY_TONES[key] || DEFAULT_CATEGORY_TONE;
}

export function getCategoryBadgeClass(category?: string): string {
  return getCategoryTone(category).badge;
}

export function getCategoryFilterClass(category: string, isSelected: boolean): string {
  if (isSelected) {
    return "bg-slate-900 text-white shadow-xs";
  }
  return getCategoryTone(category).filterUnselected;
}

export function Badge({
  children,
  category,
  variant = "default",
  className = ""
}: {
  children: React.ReactNode;
  category?: string;
  variant?: "default" | "success" | "warning" | "error" | "outline" | "neutral" | "accent";
  className?: string;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/80",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200/80",
    outline: "bg-white text-slate-700 border border-slate-300 shadow-2xs",
    success: "bg-emerald-50 text-emerald-900 border border-emerald-200/80",
    warning: "bg-amber-50 text-amber-900 border border-amber-200/80",
    error: "bg-red-50 text-red-900 border border-red-200/80",
    accent: "bg-blue-50 text-blue-900 border border-blue-200/80"
  };

  const resolvedCategory = category || (typeof children === "string" && CATEGORY_TONES[children.trim().toLowerCase()] ? children : undefined);
  const colorClass = resolvedCategory && (variant === "default" || variant === "neutral")
    ? getCategoryBadgeClass(resolvedCategory)
    : variants[variant];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium tracking-tight ${colorClass} ${className}`}>
      {children}
    </span>
  );
}
