import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-orange-500 font-mono text-sm font-bold">AgenticOS</span>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            Dashboard
          </Link>
          <Link href="/setup" className="text-gray-400 hover:text-white text-sm transition-colors">
            Setup
          </Link>
          <Link href="/skills" className="text-gray-400 hover:text-white text-sm transition-colors">
            Skills
          </Link>
        </div>
        <div className="text-gray-500 text-sm font-mono">
          {session.user.email ?? session.user.name}
        </div>
      </nav>
      {children}
    </div>
  );
}
