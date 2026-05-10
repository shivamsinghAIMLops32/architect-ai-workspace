'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Server, Database, Cloud, Lock, Globe, Layers, Cpu, MessageSquare, HardDrive, Activity, Network, Shield, Smartphone, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

function getIconForType(type: string | undefined, label: string) {
  const normalizedStr = `${type} ${label}`.toLowerCase();

  if (normalizedStr.includes('database') || normalizedStr.includes('sql')) return Database;
  if (normalizedStr.includes('server') || normalizedStr.includes('api')) return Server;
  if (normalizedStr.includes('cloud') || normalizedStr.includes('aws')) return Cloud;
  if (normalizedStr.includes('security') || normalizedStr.includes('auth') || normalizedStr.includes('firewall')) return Shield;
  if (normalizedStr.includes('web') || normalizedStr.includes('frontend') || normalizedStr.includes('cdn')) return Globe;
  if (normalizedStr.includes('mobile') || normalizedStr.includes('app')) return Smartphone;
  if (normalizedStr.includes('queue') || normalizedStr.includes('kafka') || normalizedStr.includes('rabbitmq')) return MessageSquare;
  if (normalizedStr.includes('storage') || normalizedStr.includes('s3') || normalizedStr.includes('bucket')) return HardDrive;
  if (normalizedStr.includes('cache') || normalizedStr.includes('redis')) return Layers;
  if (normalizedStr.includes('load_balancer') || normalizedStr.includes('proxy') || normalizedStr.includes('gateway')) return Network;
  if (normalizedStr.includes('monitor') || normalizedStr.includes('metric') || normalizedStr.includes('log')) return Activity;
  
  return Cpu; // Default fallback icon
}

function getTierColorClass(tier: string | undefined) {
  switch (tier) {
    case 'client': return 'border-sky-500 shadow-sky-500/20';
    case 'gateway': return 'border-amber-500 shadow-amber-500/20';
    case 'service': return 'border-violet-500 shadow-violet-500/20';
    case 'data': return 'border-emerald-500 shadow-emerald-500/20';
    case 'external': return 'border-rose-500 shadow-rose-500/20';
    default: return 'border-zinc-500 shadow-zinc-500/20';
  }
}

function getTierBgClass(tier: string | undefined) {
  switch (tier) {
    case 'client': return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    case 'gateway': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    case 'service': return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
    case 'data': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    case 'external': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    default: return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
  }
}

function getMethodColorClass(method: string) {
  switch (method?.toUpperCase()) {
    case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'PUT':
    case 'PATCH': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

export function CustomNode({ data, selected }: NodeProps) {
  const Icon = getIconForType(data.type as string, (data.label as string) || '');
  const tierClass = getTierColorClass(data.tier as string);
  const bgClass = getTierBgClass(data.tier as string);
  
  const techStack = data.techStack as string[] || [];
  const endpoints = data.endpoints as { method: string; path: string; desc: string }[] || [];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-zinc-950 shadow-xl transition-all duration-200 min-w-[350px] max-w-[400px] overflow-hidden",
        selected ? tierClass : "border-zinc-800 shadow-black/50 hover:border-zinc-700"
      )}
    >
      {/* Target handle (top) - intentionally hidden, dagre handles edges */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-8 !rounded-r-sm !rounded-l-none !border-0 !bg-zinc-700/50 -ml-1 opacity-0" />

      {/* Top accent strip */}
      <div className={cn("h-1.5 w-full", selected ? bgClass.split(' ')[0] : "bg-zinc-800")} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header: Icon + Label + Port */}
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", bgClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold tracking-tight text-zinc-100 truncate">
                {data.label as string}
              </span>
              {data.port && (
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                  :{data.port}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                {data.type as string || 'Service'}
              </span>
              {data.scaling && (
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 bg-white/5 px-1 rounded-sm border border-white/5 flex items-center gap-1">
                  {data.scaling === 'horizontal' ? '↔' : data.scaling === 'vertical' ? '↕' : '●'} {data.scaling as string}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tech Stack Pills */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techStack.map((tech, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                <Box className="w-2.5 h-2.5 text-zinc-500" />
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Body: Description */}
        {Boolean(data.description) && (
          <div className="text-xs text-zinc-400 leading-relaxed pt-1">
            {data.description as string}
          </div>
        )}

        {/* Footer: Endpoints */}
        {endpoints.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2 mt-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">API Routes</span>
            <div className="flex flex-col gap-1.5">
              {endpoints.map((endpoint, i) => (
                <div key={i} className="flex items-start gap-2 bg-zinc-900/50 rounded p-1.5 border border-white/5">
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 min-w-[40px] text-center", getMethodColorClass(endpoint.method))}>
                    {endpoint.method || 'ANY'}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-zinc-300 truncate" title={endpoint.path}>{endpoint.path}</span>
                    <span className="text-[9px] text-zinc-500 truncate" title={endpoint.desc}>{endpoint.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Source handle (right) - intentionally hidden */}
      <Handle type="source" position={Position.Right} className="!w-2 !h-8 !rounded-l-sm !rounded-r-none !border-0 !bg-zinc-700/50 -mr-1 opacity-0" />
    </div>
  );
}
