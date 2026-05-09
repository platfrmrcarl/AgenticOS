import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center max-w-2xl">
        <div className="text-orange-500 font-mono text-sm mb-4 tracking-widest uppercase">
          Claude Code
        </div>
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Build Your Agentic OS
        </h1>
        <p className="text-gray-400 text-xl mb-10 leading-relaxed">
          Turn Claude Code from random prompts into a system you can run, track, and hand off.
        </p>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-amber-400 text-white font-semibold px-8 py-4 text-lg transition-colors"
        >
          Get Started →
        </Link>
        <div className="mt-8 text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 hover:text-amber-400">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
