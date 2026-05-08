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
        "relative flex flex-col gap-3 rounded-xl border bg-zinc-950 p-4 shadow-xl transition-all duration-200 min-w-[280px] max-w-[350px]",
        selected ? "border-violet-500 shadow-violet-500/20" : "border-zinc-800 shadow-black/50 hover:border-zinc-700"
      )}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 rounded-full border-2 border-zinc-950 bg-zinc-400 hover:bg-violet-400 hover:scale-125 transition-all"
      />

      {/* Header: Icon + Label */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-sm font-bold tracking-tight text-zinc-100 truncate">
            {data.label as string}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-violet-400/80 font-semibold mt-0.5">
            {data.type as string || 'Service'}
          </span>
        </div>
      </div>

      {/* Body: Description */}
      {Boolean(data.description) && (
        <div className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
          {data.description as string}
        </div>
      )}

      {/* Footer: Endpoints */}
      {Array.isArray(data.endpoints) && data.endpoints.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Endpoints</span>
          <div className="flex flex-wrap gap-1.5">
            {data.endpoints.map((endpoint: string, i: number) => (
              <span key={i} className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-mono text-zinc-300">
                {endpoint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 rounded-full border-2 border-zinc-950 bg-zinc-400 hover:bg-violet-400 hover:scale-125 transition-all"
      />
    </div>
  );
}
