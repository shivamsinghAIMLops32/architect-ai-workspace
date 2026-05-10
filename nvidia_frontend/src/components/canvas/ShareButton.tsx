'use client';

import { useState } from 'react';
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
import { Share2, Copy, Check } from 'lucide-react';

export function ShareButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerateLink() {
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ data: { shareToken: string } }>(`/projects/${projectId}/share`);
      
      // Construct full URL
      const url = `${window.location.origin}/share/${res.data.shareToken}`;
      setShareUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && !shareUrl) {
        handleGenerateLink();
      }
    }}>
      <DialogTrigger render={
        <Button variant="outline" className="border-cyan-300/25 bg-zinc-950/75 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300/10">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      } />
      <DialogContent className="glass-panel sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Share Architecture</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Anyone with this link can view a read-only version of this diagram.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Input
              readOnly
              value={loading ? 'Generating link...' : shareUrl}
              className="border-white/10 bg-white/5 text-zinc-300 focus-visible:ring-cyan-300/50"
            />
          </div>
          <Button 
            onClick={handleCopy}
            disabled={loading || !shareUrl}
            className="bg-cyan-200 px-3 text-zinc-950 hover:bg-lime-200"
          >
            <span className="sr-only">Copy</span>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-400 mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
