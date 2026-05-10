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
import { Loader2, Share2, Copy, Check } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link');
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
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-zinc-900 border-violet-500/30 hover:bg-violet-500/10 text-violet-300">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/10 bg-card">
        <DialogHeader>
          <DialogTitle>Share Architecture</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Anyone with this link can view a read-only version of this diagram.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Input
              readOnly
              value={loading ? 'Generating link...' : shareUrl}
              className="bg-white/5 border-white/10 text-zinc-300"
            />
          </div>
          <Button 
            onClick={handleCopy}
            disabled={loading || !shareUrl}
            className="px-3 bg-violet-600 hover:bg-violet-500"
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
