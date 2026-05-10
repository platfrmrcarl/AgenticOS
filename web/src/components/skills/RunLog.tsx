import type { SkillRun, Skill } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface RunWithSkill extends SkillRun {
  skill: Pick<Skill, "name"> | null;
}

interface RunLogProps {
  runs: RunWithSkill[];
}

export function RunLog({ runs }: RunLogProps) {
  const statusVariant = (status: string) => {
    if (status === "COMPLETED") return "success";
    if (status === "FAILED") return "destructive";
    if (status === "RUNNING") return "warning";
    return "default";
  };

  return (
    <div className="w-64 border-l border-gray-800 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-800 text-xs font-mono text-gray-500 uppercase tracking-widest">
        Recent Runs
      </div>
      {runs.length === 0 ? (
        <p className="text-gray-600 text-xs px-4 py-3 font-mono">No runs yet</p>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {runs.map((run) => (
            <div key={run.id} className="px-4 py-3">
              <p className="text-white text-xs font-medium mb-1 truncate">{run.skill?.name ?? "Unknown"}</p>
              <div className="flex items-center justify-between">
                <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                <span className="text-gray-600 text-[10px] font-mono">
                  {run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : "--"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
