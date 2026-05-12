import { cn } from "@/lib/utils";

const PHASES = [
  { num: 1, label: "Collecting" },
  { num: 2, label: "Automating" },
  { num: 3, label: "Delivering" },
];

interface PhaseIndicatorProps {
  currentPhase: number;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  return (
    <div className="flex flex-col gap-1 py-8 px-4">
      {PHASES.map((phase) => {
        const isActive = phase.num === currentPhase;
        const isComplete = phase.num < currentPhase;
        return (
          <div
            key={phase.num}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded transition-colors",
              isActive && "bg-primary/10 border border-primary/30",
              isComplete && "opacity-60",
              !isActive && !isComplete && "opacity-30"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0",
                isActive && "bg-primary text-primary-foreground",
                isComplete && "bg-green-500 text-foreground",
                !isActive && !isComplete && "bg-muted text-muted-foreground border border-border"
              )}
            >
              {isComplete ? "✓" : phase.num}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                isActive && "text-foreground",
                !isActive && "text-muted-foreground"
              )}
            >
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
