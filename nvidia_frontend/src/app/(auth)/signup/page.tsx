'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Cpu } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? 'Could not create account. Please try again.');
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* ── Ambient glow blobs ── */}
      <div
        aria-hidden="true"
        className="animate-brand-glow pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-brand-glow pointer-events-none absolute -bottom-20 right-10 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-3xl"
        style={{ animationDelay: '2.5s' }}
      />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm px-4 animate-fade-in-up">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 shadow-lg shadow-violet-500/10">
            <Cpu className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
            Architect AI
          </p>
        </div>

        <Card className="border-white/8 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="text-zinc-400 text-sm">
              Start designing intelligent systems
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Error banner */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="signup-name"
                  className="text-sm font-medium text-zinc-300"
                >
                  Full name
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/10 bg-white/5 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-zinc-300"
                >
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/5 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-zinc-300"
                >
                  Password
                  <span className="ml-2 text-xs text-zinc-600 font-normal">
                    min. 8 characters
                  </span>
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/10 bg-white/5 placeholder:text-zinc-600 focus-visible:ring-violet-500/50 transition-all duration-200"
                />
              </div>

              <Button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500/50 transition-all duration-200 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-violet-400 hover:text-violet-300 transition-colors duration-150 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
