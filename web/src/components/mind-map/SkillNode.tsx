import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Badge } from "@/components/ui/badge";

interface SkillNodeData {
  label: string;
  frequency: "ON_DEMAND" | "LOCAL_ROUTINE" | "CLOUD_ROUTINE";
  description?: string;
}

export const SkillNode = memo(({ data }: { data: SkillNodeData }) => {
  const freqVariant = {
    ON_DEMAND: "default",
    LOCAL_ROUTINE: "warning",
    CLOUD_ROUTINE: "success",
  }[data.frequency] as "default" | "warning" | "success";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 min-w-[140px] max-w-[180px] hover:border-orange-500/50 transition-colors cursor-pointer">
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
      <p className="text-white text-xs font-medium leading-tight mb-1">{data.label}</p>
      {data.description && (
        <p className="text-gray-500 text-xs leading-tight mb-2 line-clamp-2">{data.description}</p>
      )}
      <Badge variant={freqVariant} className="text-[10px]">
        {data.frequency.replace("_", " ")}
      </Badge>
    </div>
  );
});
SkillNode.displayName = "SkillNode";
