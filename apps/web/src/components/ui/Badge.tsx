export function Badge({
  children,
  variant = "default",
  className = ""
}: {
  children: React.ReactNode;
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
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium tracking-tight ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
