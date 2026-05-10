'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/store/project-store';
import { Cpu } from 'lucide-react';

interface NodeEditorPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export function NodeEditorPanel({ nodeId, onClose }: NodeEditorPanelProps) {
  const { nodes, setNodes } = useProjectStore();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [nodeType, setNodeType] = useState('service');
  const [tier, setTier] = useState('service');

  const node = nodes.find(n => n.id === nodeId);

  useEffect(() => {
    if (node) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabel((node.data.label as string) || '');
      setDescription((node.data.description as string) || '');
      setNodeType((node.data.type as string) || node.type || 'service');
      setTier((node.data.tier as string) || 'service');
    }
  }, [node]);

  const handleSave = () => {
    if (!nodeId) return;
    
    setNodes(
      nodes.map(n => 
        n.id === nodeId 
          ? { ...n, type: 'custom', data: { ...n.data, label, description, type: nodeType, tier } }
          : n
      )
    );
    
    // We would optionally sync this to the backend REST API if we want it persisted outside of just the WebSocket memory, 
    // but the next AI generation will overwrite the DB anyway based on the UI state, 
    // or we could add a `updateNodeData` endpoint. For now, live UI update is requested.
    onClose();
  };

  return (
    <Sheet open={!!nodeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="border-l border-white/10 bg-zinc-950/95 text-zinc-100 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:max-w-md">
        <SheetHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8">
            <Cpu className="h-4 w-4 text-cyan-100" />
          </div>
          <SheetTitle className="text-xl font-black text-zinc-100">Edit Node</SheetTitle>
          <SheetDescription className="text-zinc-500">
            Update the properties of the selected infrastructure node.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 flex flex-col">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Label</label>
            <Input 
              value={label} 
              onChange={(e) => setLabel(e.target.value)} 
              className="border-white/10 bg-white/5 text-zinc-200 focus-visible:ring-cyan-300/50"
              placeholder="e.g. Nginx Load Balancer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Type</label>
              <Input
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                className="border-white/10 bg-white/5 text-zinc-200 focus-visible:ring-cyan-300/50"
                placeholder="api_server"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none transition-all focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
              >
                <option value="client">Client</option>
                <option value="gateway">Gateway</option>
                <option value="service">Service</option>
                <option value="data">Data</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="border-white/10 bg-white/5 text-zinc-200 focus-visible:ring-cyan-300/50"
              placeholder="e.g. Routes traffic to API instances"
            />
          </div>

          <Button 
            onClick={handleSave}
            className="mt-4 w-full bg-cyan-200 text-zinc-950 hover:bg-lime-200"
          >
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
