import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function enableSelected(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const allDrafts = await prisma.skill.findMany({
    where: { userId, enabled: false },
    select: { id: true },
  });
  const toEnable: string[] = [];
  for (const s of allDrafts) {
    if (formData.get(`enabled-${s.id}`) === "on") toEnable.push(s.id);
  }
  if (toEnable.length > 0) {
    await prisma.skill.updateMany({
      where: { id: { in: toEnable }, userId },
      data: { enabled: true },
    });
  }
  redirect("/dashboard");
}

const FREQUENCY_LABEL: Record<string, string> = {
  ON_DEMAND: "on-demand",
  LOCAL_ROUTINE: "local routine",
  CLOUD_ROUTINE: "cloud routine",
};

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const domains = await prisma.domain.findMany({
    where: { userId: session.user.id },
    include: {
      skills: { where: { enabled: false }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { position: "asc" },
  });

  const populated = domains.filter((d) => d.skills.length > 0);

  if (populated.length === 0) {
    return (
      <div className="min-h-[calc(100vh-49px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">No drafts to review</h1>
          <p className="mt-2 text-muted-foreground">
            Looks like your auto-configuration didn&apos;t produce any drafts.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/setup">
              <Button variant="outline">Run setup again</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSkills = populated.reduce((sum, d) => sum + d.skills.length, 0);

  return (
    <div className="min-h-[calc(100vh-49px)] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Review &amp; Enable
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
          We drafted {totalSkills} skills across {populated.length} domains.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Toggle off anything you don&apos;t want. Enabled skills show up on your
          dashboard. You can edit or add more from the Skills page later.
        </p>

        <form action={enableSelected} className="mt-10 space-y-6">
          {populated.map((domain) => (
            <div
              key={domain.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h2 className="font-semibold text-base">{domain.name}</h2>
                {domain.successVision && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {domain.successVision}
                  </p>
                )}
              </div>
              <ul className="divide-y divide-border">
                {domain.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`skill-${skill.id}`}
                      name={`enabled-${skill.id}`}
                      defaultChecked
                      className="mt-1 w-4 h-4 rounded border-border accent-primary"
                    />
                    <label
                      htmlFor={`skill-${skill.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-sm text-foreground">
                          {skill.name}
                        </span>
                        <Badge className="text-[10px] uppercase tracking-wider">
                          {FREQUENCY_LABEL[skill.frequency] ?? skill.frequency}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {skill.description}
                      </p>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <Link href="/setup">
              <Button type="button" variant="ghost">
                Start over
              </Button>
            </Link>
            <Button type="submit">Continue to dashboard</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
