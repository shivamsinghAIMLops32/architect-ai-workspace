'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Cpu, LogOut, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/store/project-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const { data: session, isPending } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top nav bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-background/80 px-5 backdrop-blur-sm z-10">
          {/* Left: breadcrumb / title */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/20 mr-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] group cursor-pointer" onClick={() => router.push('/dashboard')}>
              <Cpu className="h-4 w-4 text-violet-300 group-hover:animate-pulse" />
            </div>
            <Button variant="link" onClick={() => router.push('/dashboard')} className="p-0 h-auto text-sm font-semibold text-zinc-300 hover:text-violet-400">
              Architect AI
            </Button>
            {projectId && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="text-sm font-medium text-foreground">Project {projectId.slice(0,6)}</span>
              </>
            )}
          </div>

          {/* Right: user chip + sign-out */}
          <div className="flex items-center gap-3">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 py-1 pl-1 pr-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/30 text-violet-300">
                    <span className="text-[10px] font-bold uppercase">
                      {session.user.name?.[0] ?? session.user.email[0]}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>

                <Button
                  id="sign-out-button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="h-8 gap-1.5 px-2.5 text-zinc-400 hover:text-foreground hover:bg-white/6 transition-all duration-200"
                >
                  {signingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">Sign out</span>
                </Button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Canvas area */}
        <main className="relative flex-1 overflow-hidden bg-dot-grid">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.09_0_0)_100%)] z-0"
          />
          <div className="relative z-10 h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
