export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "error" | "outline" | "neutral" }) {
  const variants = {
    default: "bg-slate-100 text-slate-800",
    neutral: "bg-slate-100 text-slate-700",
    outline: "bg-white text-slate-700 border border-slate-300",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
