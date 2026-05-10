'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Sparkles } from 'lucide-react';
import { ArchitectLogo } from '@/components/brand/architect-logo';

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
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/70 px-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {/* Left: breadcrumb / title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg outline-none transition-transform duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-cyan-300/60"
              aria-label="Go to dashboard"
            >
              <ArchitectLogo subtitle="Workspace" />
            </button>
            {projectId && <span className="hidden h-6 w-px bg-white/10 sm:block" />}
            {projectId && (
              <div className="hidden items-center gap-2 sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-lime-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Project {projectId.slice(0, 6)}
                </span>
              </div>
            )}
            <Button variant="link" onClick={() => router.push('/dashboard')} className="sr-only">
              Dashboard
            </Button>
          </div>

          {/* Right: user chip + sign-out */}
          <div className="flex items-center gap-3">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 py-1 pl-1 pr-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/20">
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
                  className="h-8 gap-1.5 px-2.5 text-zinc-400 transition-all duration-200 hover:bg-white/6 hover:text-foreground"
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
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,oklch(0.105_0.012_230)_100%)]"
          />
          <div className="relative z-10 h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
