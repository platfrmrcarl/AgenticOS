import { memo } from "react";
import { Handle, Position } from "reactflow";

const DOMAIN_COLORS = [
  "border-orange-500/60 text-orange-400",
  "border-blue-500/60 text-blue-400",
  "border-purple-500/60 text-purple-400",
  "border-cyan-500/60 text-cyan-400",
  "border-pink-500/60 text-pink-400",
];

interface DomainNodeData {
  label: string;
  index: number;
  skillCount: number;
}

export const DomainNode = memo(({ data }: { data: DomainNodeData }) => {
  const colorClass = DOMAIN_COLORS[data.index % DOMAIN_COLORS.length];
  return (
    <div className={`bg-gray-900/80 border-2 ${colorClass} rounded-lg px-4 py-3 min-w-[120px] text-center`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
      <p className="font-semibold text-sm">{data.label}</p>
      <p className="text-gray-500 text-xs mt-1">{data.skillCount} skills</p>
      <Handle type="source" position={Position.Right} className="!bg-gray-600 !border-gray-600 !w-2 !h-2" />
    </div>
  );
});
DomainNode.displayName = "DomainNode";
