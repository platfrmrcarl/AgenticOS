interface Stat {
  label: string;
  value: string | number;
}

interface StatBarProps {
  stats: Stat[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div className="flex items-center gap-8 px-6 py-3 border-b border-gray-800 bg-gray-950/50">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">{stat.label}</span>
          <span className="text-orange-400 text-sm font-mono font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
