import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium",
        variant === "default" && "bg-gray-800 text-orange-400 border border-orange-500/30",
        variant === "success" && "bg-green-900/30 text-green-400 border border-green-500/30",
        variant === "warning" && "bg-amber-900/30 text-amber-400 border border-amber-500/30",
        variant === "destructive" && "bg-red-900/30 text-red-400 border border-red-500/30",
        className
      )}
    >
      {children}
    </span>
  );
}
