import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-gray-900/50 border border-gray-800 rounded-lg", className)}
      {...props}
    >
      {children}
    </div>
  );
}
