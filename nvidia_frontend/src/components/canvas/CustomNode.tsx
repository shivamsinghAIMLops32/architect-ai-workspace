'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Server, Database, Cloud, Lock, Globe, Layers, Settings, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

function getIconForType(type: string | undefined, label: string) {
  const normalizedStr = `${type} ${label}`.toLowerCase();

  if (normalizedStr.includes('database') || normalizedStr.includes('sql') || normalizedStr.includes('redis')) return Database;
  if (normalizedStr.includes('server') || normalizedStr.includes('api')) return Server;
  if (normalizedStr.includes('cloud') || normalizedStr.includes('aws')) return Cloud;
  if (normalizedStr.includes('security') || normalizedStr.includes('auth') || normalizedStr.includes('gateway')) return Lock;
  if (normalizedStr.includes('web') || normalizedStr.includes('frontend') || normalizedStr.includes('cdn')) return Globe;
  if (normalizedStr.includes('queue') || normalizedStr.includes('kafka') || normalizedStr.includes('redis')) return Layers;
  if (normalizedStr.includes('cache')) return Database;
  
  return Cpu; // Default fallback icon
}

export function CustomNode({ data, selected }: NodeProps) {
  const Icon = getIconForType(data.type as string, (data.label as string) || '');
  const isDefault = !data.type || data.type === 'default';

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border bg-zinc-950 px-4 py-3 shadow-lg transition-all duration-200 min-w-[180px]",
        selected ? "border-violet-500 shadow-violet-500/20" : "border-zinc-800 shadow-black/50 hover:border-zinc-700"
      )}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 rounded-full border-2 border-zinc-950 bg-zinc-500 hover:bg-violet-400 hover:scale-125 transition-all"
      />

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
        <Icon className="h-5 w-5 text-violet-400" />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-sm font-semibold tracking-tight text-zinc-100 truncate">
          {data.label as string}
        </span>
        {Boolean(data.description) && (
          <span className="text-xs text-zinc-500 truncate mt-0.5">
            {data.description as string}
          </span>
        )}
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 rounded-full border-2 border-zinc-950 bg-zinc-500 hover:bg-violet-400 hover:scale-125 transition-all"
      />
    </div>
  );
}
