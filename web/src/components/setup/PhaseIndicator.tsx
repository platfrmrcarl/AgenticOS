import { cn } from "@/lib/utils";

const PHASES = [
  { num: 1, label: "Brain Dump" },
  { num: 2, label: "Domain Locking" },
  { num: 3, label: "Skill Surfacing" },
  { num: 4, label: "Automation Triage" },
  { num: 5, label: "Deliverables" },
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
              isActive && "bg-orange-500/10 border border-orange-500/30",
              isComplete && "opacity-60",
              !isActive && !isComplete && "opacity-30"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0",
                isActive && "bg-orange-500 text-white",
                isComplete && "bg-green-500 text-white",
                !isActive && !isComplete && "bg-gray-800 text-gray-500 border border-gray-700"
              )}
            >
              {isComplete ? "✓" : phase.num}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                isActive && "text-white",
                !isActive && "text-gray-500"
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
