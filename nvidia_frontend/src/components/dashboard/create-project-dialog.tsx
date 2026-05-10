'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Sparkles } from 'lucide-react';

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ data: { id: string } }>('/projects', { name });
      setOpen(false);
      setName('');
      // Navigate to the new project canvas
      router.push(`/dashboard/project/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setLoading(false);
    }
  }

  return (
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="h-10 bg-cyan-200 text-zinc-950 shadow-[0_0_30px_rgba(34,211,238,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime-200">
          <Plus className="mr-2 h-4 w-4" />
          New Architecture
        </Button>
      } />
      <DialogContent className="glass-panel sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8">
            <Sparkles className="h-4 w-4 text-cyan-100" />
          </div>
          <DialogTitle className="text-xl font-black">Create new architecture</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Start a new system design canvas. You can ask AI to generate the initial layout.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-300">
              Project Name
            </label>
            <Input
              id="name"
              placeholder="e.g., E-commerce Microservices"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/10 bg-white/5 focus-visible:ring-cyan-300/50"
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-cyan-200 text-zinc-950 hover:bg-lime-200"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Canvas
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
