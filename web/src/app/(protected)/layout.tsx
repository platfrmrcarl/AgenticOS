import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-primary font-mono text-sm font-bold">Agentic Operations</span>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Dashboard
          </Link>
          <Link href="/setup" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Setup
          </Link>
          <Link href="/skills" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Skills
          </Link>
          <Link href="/wiki" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Wiki
          </Link>
        </div>
        <UserMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
      </nav>
      {children}
    </div>
  );
}
