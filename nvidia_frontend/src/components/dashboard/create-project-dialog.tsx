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
import { Loader2, Plus } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-violet-600 text-white hover:bg-violet-500 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          New Architecture
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px] border-white/10 bg-card">
        <DialogHeader>
          <DialogTitle>Create new architecture</DialogTitle>
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
              className="border-white/10 bg-white/5 focus-visible:ring-violet-500/50"
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-violet-600 hover:bg-violet-500"
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
