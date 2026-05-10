import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MindMapCanvas } from "@/components/mind-map/MindMapCanvas";
import { ActivityChart } from "@/components/observability/ActivityChart";
import { StatBar } from "@/components/observability/StatBar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [skills, domains, runs] = await Promise.all([
    prisma.skill.findMany({ where: { userId }, include: { domain: true } }),
    prisma.domain.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.skillRun.findMany({
      where: { userId, startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const runsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    runsByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const run of runs) {
    const day = run.startedAt.toISOString().slice(0, 10);
    if (day in runsByDay) runsByDay[day]++;
  }
  const chartData = Object.entries(runsByDay).map(([date, runs]) => ({
    date: date.slice(5),
    runs,
  }));

  const todayRuns = runs.filter(
    (r: (typeof runs)[0]) => r.startedAt.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
  ).length;

  const stats = [
    { label: "Platform", value: "Claude Code" },
    { label: "Runs Today", value: todayRuns },
    { label: "Active Skills", value: skills.length },
    { label: "Total Runs", value: runs.length },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      <StatBar stats={stats} />
      <div className="flex-1 overflow-hidden">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-4">No skills yet. Complete the setup wizard to build your Agentic OS.</p>
            <Link href="/setup" className="text-orange-500 hover:text-amber-400 text-sm">
              Start Setup →
            </Link>
          </div>
        ) : (
          <MindMapCanvas skills={skills} domains={domains} userName={session.user.name ?? "Me"} />
        )}
      </div>
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
          Activity — Last 30 Days
        </div>
        <ActivityChart data={chartData} />
      </div>
    </div>
  );
}
