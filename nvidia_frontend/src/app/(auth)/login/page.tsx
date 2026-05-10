'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowRight, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { ArchitectLogo } from '@/components/brand/architect-logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? 'Invalid credentials. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-dot-grid" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_22%,rgba(34,211,238,0.14),transparent_30rem),radial-gradient(circle_at_80%_82%,rgba(190,242,100,0.09),transparent_26rem)]" aria-hidden="true" />

      <div className="relative z-10 grid min-h-screen items-center gap-10 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <section className="hidden max-w-2xl animate-fade-in-up lg:block">
          <ArchitectLogo subtitle="System design cockpit" />
          <h1 className="text-balance mt-10 text-6xl font-black leading-[0.95] tracking-tight text-zinc-50">
            Design distributed systems at conversation speed.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Chat with an AI architect, stream structured decisions, and watch production diagrams assemble on a real canvas.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {[
              ['Tier aware', Network],
              ['Secure workspaces', ShieldCheck],
              ['NIM powered', Sparkles],
            ].map(([label, Icon]) => {
              const TypedIcon = Icon as typeof Network;
              return (
                <div key={label as string} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 backdrop-blur">
                  <TypedIcon className="mb-3 h-4 w-4 text-cyan-100" />
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">{label as string}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mx-auto w-full max-w-sm animate-fade-in-scale">
          <div className="mb-8 flex justify-center lg:hidden">
            <ArchitectLogo subtitle="Workspace" />
          </div>

        <Card className="glass-panel rounded-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-black tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              Sign in to continue building architecture maps.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-semibold text-zinc-300">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/5 placeholder:text-zinc-600 transition-all duration-200 focus-visible:ring-cyan-300/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-semibold text-zinc-300">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/10 bg-white/5 placeholder:text-zinc-600 transition-all duration-200 focus-visible:ring-cyan-300/50"
                />
              </div>

              <Button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="h-10 w-full bg-cyan-200 text-zinc-950 shadow-[0_0_28px_rgba(34,211,238,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                No account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-cyan-200 transition-colors duration-150 hover:text-lime-200"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
